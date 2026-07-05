import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// Library build consumed by design-sync (NOT the app build). Emits dist-lib/index.js
// (ESM) exposing the presentational components on the barrel, plus per-component .d.ts
// declarations — the converter reads those to determine the public component API.
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src/components/**/*.ts", "src/components/**/*.tsx"],
      exclude: ["src/components/**/*.stories.tsx", "src/components/fixtures.ts"],
      outDir: "dist-lib",
    }),
  ],
  build: {
    outDir: "dist-lib",
    emptyOutDir: true,
    lib: {
      entry: "src/components/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
