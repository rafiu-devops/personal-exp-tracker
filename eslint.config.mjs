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
    "coverage/**",
  ]),
  {
    rules: {
      // Our effects intentionally synchronise React state with external systems
      // (localStorage, matchMedia, Firebase auth, syncing forms from props).
      // This React Compiler heuristic flags those legitimate patterns.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
