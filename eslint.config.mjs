import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    // Next.js
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Dependencies
    "node_modules/**",

    // Coverage
    "coverage/**",

    // Playwright generated files
    "playwright-report/**",
    "test-results/**",

    // Vercel
    ".vercel/**",

    // Static build output
    "dist/**",

    // Generated contract bindings
    "src/lib/contracts/**/dist/**",
    "src/lib/contracts/**/src/**",
  ]),
]);