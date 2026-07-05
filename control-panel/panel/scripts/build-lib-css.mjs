// Compile the panel's CSS into one stylesheet for design-sync's _ds_bundle.css.
// tokens.css, base.css and panel.css contain no cross-@imports (only :root vars and
// @media), so concatenation IS the compiled output.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const parts = [
  "src/tokens/tokens.css",
  "src/tokens/base.css",
  "src/components/panel.css",
];

mkdirSync("dist-lib", { recursive: true });
const css = parts.map((p) => readFileSync(p, "utf8")).join("\n");
writeFileSync("dist-lib/vpt-panel.css", css);
console.log(`wrote dist-lib/vpt-panel.css (${css.length} bytes)`);
