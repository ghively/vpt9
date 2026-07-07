import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

// docs/CONTROL_PANEL_CODE_QUALITY.md finding #8: no lint config existed anywhere in the
// panel, so nothing enforced React's hooks rules — react-hooks/exhaustive-deps
// specifically would have caught finding #1 (an unstable `send` reference from
// useSocket causing useMidi's effect to re-run up to 30x/sec).
export default tseslint.config(
  { ignores: ["dist", "dist-lib", "storybook-static", "ds-bundle", ".design-sync", ".ds-sync", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Build-time config/scripts run under Node, not the browser — vite/storybook config
    // files and the lib-CSS build script.
    files: ["*.config.{js,ts}", ".storybook/**/*.ts", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Deliberately NOT `reactHooks.configs.recommended` — v7 bundles the new "React
      // Compiler" rule family (react-hooks/refs, set-state-in-effect, purity, etc.),
      // which flags this codebase's deliberate, non-compiler patterns (e.g. the
      // handlersRef.current = handlers "latest ref" mirror in useSocket.ts/useMidi.ts —
      // exactly the pattern that fixed finding #1). Just the two classic, uncontroversial
      // rules the finding actually asked for.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
