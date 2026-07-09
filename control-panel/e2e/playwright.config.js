import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  workers: 1, // each test boots its own server on a fixed port; keep serial
  reporter: [["list"]],
  use: {
    headless: true,
  },
});
