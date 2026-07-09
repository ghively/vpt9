import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function extractArrayLiteral(filePath, constName) {
  const src = readFileSync(filePath, "utf8");
  const re = new RegExp(`${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]`);
  const match = re.exec(src);
  if (!match) throw new Error(`${constName} not found in ${filePath}`);
  return [...match[1].matchAll(/"([a-zA-Z]+)"/g)].map((m) => m[1]);
}

test("render-client and panel blend-mode lists have the same 24 modes in the same order", () => {
  const clientModes = extractArrayLiteral(path.join(__dirname, "../../render-client/src/layers.js"), "BLEND_MODES");
  const panelModes = extractArrayLiteral(path.join(__dirname, "../../panel/src/components/types.ts"), "BLEND_MODES");
  assert.deepEqual(clientModes, panelModes);
  assert.equal(clientModes.length, 24);
});
