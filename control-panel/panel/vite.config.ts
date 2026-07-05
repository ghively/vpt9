import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The panel is a static SPA served per the control-plane host; `base: "./"` keeps asset
// URLs relative so the built dist/ works behind any static server or Docker mount.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 8082, host: true },
});
