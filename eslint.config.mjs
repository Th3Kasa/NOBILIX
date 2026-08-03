import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktrees contain their own .next builds — exclude from root lint
    ".worktrees/**",
    ".claude/**",
    ".Codex/**",
    // design-sync: vendored converter scripts and generated bundle output.
    ".ds-sync/**",
    "ds-bundle/**",
  ]),
]);

export default eslintConfig;
