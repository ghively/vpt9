import { test, expect } from "@playwright/test";
// Collections (owner redesign 2026-07-16, spec: docs/superpowers/specs/
// 2026-07-16-media-library-collections-design.md): folders-first media bin where a
// collection is a `collection:<Name>` entry in the item's own keyword list. Same
// panel-build/static-serve bootstrap as deck-panel.spec.js.
import { spawnSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import os from "node:os";
import { rmSync, mkdirSync, copyFileSync } from "node:fs";
import handler from "serve-handler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PANEL_DIR = path.join(REPO_ROOT, "panel");
// 8196/8197: clear of the dev stack (8080-8082), other specs (8180-8187), deck-panel
// (8194/8195).
const WS_PORT = 8196;
const PANEL_PORT = 8197;
let serverProc, staticServer;

const TMP_BASE = path.join(os.tmpdir(), `vpt-e2e-collections-${process.pid}`);
const STATE_FILE = `${TMP_BASE}.json`;
const MEDIA_DIR = `${TMP_BASE}-media`;
const FIXTURES = path.join(__dirname, "fixtures");

function buildPanel() {
  const viteBin = path.join(PANEL_DIR, "node_modules", "vite", "bin", "vite.js");
  const result = spawnSync(process.execPath, [viteBin, "build"], { cwd: PANEL_DIR, stdio: "inherit", timeout: 120_000 });
  if (result.status !== 0) throw new Error(`panel build failed (exit ${result.status ?? "timeout"})`);
}

async function startServer() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  serverProc = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(REPO_ROOT, "server"),
    env: { ...process.env, PORT: String(WS_PORT), STATE_FILE, MEDIA_DIR, OSC_PORT: "0" },
    stdio: "pipe",
  });
  await new Promise((resolve, reject) => {
    const onData = (buf) => { if (buf.toString().includes("listening")) { serverProc.stdout.off("data", onData); resolve(); } };
    serverProc.stdout.on("data", onData);
    serverProc.on("exit", (code) => reject(new Error(`server exited early (${code})`)));
    setTimeout(() => reject(new Error("server did not start")), 10_000);
  });
}

async function startStatic() {
  staticServer = http.createServer((req, res) => handler(req, res, { public: path.join(PANEL_DIR, "dist"), cleanUrls: false }));
  await new Promise((resolve) => staticServer.listen(PANEL_PORT, resolve));
}

// Upload the blink-gif fixture through the real endpoint (with an optional collection
// via X-Media-Tags — the exact path a producer/generator uses).
async function uploadFixture(name, tagsHeader) {
  const bytes = await import("node:fs/promises").then((fs) => fs.readFile(path.join(FIXTURES, "media-fixture-blink.gif")));
  const headers = { "X-File-Name": name };
  if (tagsHeader) headers["X-Media-Tags"] = tagsHeader;
  const res = await fetch(`http://127.0.0.1:${WS_PORT}/api/media`, { method: "POST", headers, body: bytes });
  if (!res.ok) throw new Error(`fixture upload failed (${res.status})`);
  return (await res.json()).media;
}

test.beforeAll(async () => {
  buildPanel();
  await startServer();
  await startStatic();
});
test.afterAll(async () => {
  staticServer?.close();
  serverProc?.kill();
  rmSync(STATE_FILE, { force: true });
  rmSync(MEDIA_DIR, { recursive: true, force: true });
});

test("folders-first bin: collections derive from tags, drill-in scopes, membership edits round-trip", async ({ page }) => {
  // Three items: two in "Space" (one via the X-Media-Tags producer path with a loose
  // tag too), one untagged.
  const a = await uploadFixture("nebula.gif", "collection:Space, stars");
  await uploadFixture("comet.gif", "collection:Space");
  const c = await uploadFixture("loose.gif");

  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  await page.goto(`http://localhost:${PANEL_PORT}/index.html?ws=ws://localhost:${WS_PORT}`);
  // The sidebar is tabbed (Layers/Media/Inspector, one visible at a time) — MediaBin
  // only renders once the Media tab is active.
  await page.locator(".sidebar-tabs button", { hasText: "Media" }).click();

  const bin = page.locator(".media-bin");
  await expect(bin).toBeVisible();

  // Folder list: All (3), Untagged (1), Space (2). The loose tag "stars" must NOT be a folder.
  const folders = bin.locator(".media-folder");
  await expect(folders.filter({ hasText: "All" })).toContainText("3");
  await expect(folders.filter({ hasText: "Untagged" })).toContainText("1");
  await expect(folders.filter({ hasText: "Space" })).toContainText("2");
  await expect(folders.filter({ hasText: "stars" })).toHaveCount(0);

  // Drill into Space: exactly the two members, breadcrumb back works, loose-tag chip visible.
  await folders.filter({ hasText: "Space" }).click();
  await expect(bin.locator(".media-cell")).toHaveCount(2);
  await expect(bin.locator(".media-bin__filters--tags .chip", { hasText: "#stars" })).toBeVisible();
  await expect(bin.locator(".media-bin__back")).toContainText("Space");

  // Remove one item from Space via the context menu; folder count drops to 1 and the
  // item lands in Untagged (its collection entry — not its loose tag — was removed).
  await bin.locator(".media-cell").filter({ hasText: "nebula" }).click({ button: "right" });
  await page.getByText("Remove from Space").click();
  await expect(bin.locator(".media-cell")).toHaveCount(1);
  await bin.locator(".media-bin__back").click();
  await expect(folders.filter({ hasText: "Space" })).toContainText("1");
  await expect(folders.filter({ hasText: "Untagged" })).toContainText("2");

  // Server state agrees: the loose tag survived the collection removal.
  const state = await (await fetch(`http://127.0.0.1:${WS_PORT}/state`)).json();
  expect(state.media[a.id].tags).toEqual(["stars"]);

  // Add the untagged item to Space via the context menu (from inside All).
  await folders.filter({ hasText: "All" }).click();
  await bin.locator(".media-cell").filter({ hasText: "loose" }).click({ button: "right" });
  await page.getByText("Add to Space").click();
  await bin.locator(".media-bin__back").click();
  await expect(folders.filter({ hasText: "Space" })).toContainText("2");
  const state2 = await (await fetch(`http://127.0.0.1:${WS_PORT}/state`)).json();
  expect(state2.media[c.id].tags).toEqual(["collection:Space"]);

  // Create a fresh (pending/empty) collection; it appears as a folder and opens.
  await page.getByText("+ new collection").click();
  await bin.locator(".media-bin__new-collection").fill("Textures");
  await bin.locator(".media-bin__new-collection").press("Enter");
  await expect(bin.locator(".media-bin__back")).toContainText("Textures");
  await expect(bin.locator(".media-cell")).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});
