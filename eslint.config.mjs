// jura-contracts ESLint flat config (ESLint 9). This repo has a `lint` script and the
// eslint/typescript-eslint devDependencies since scaffolding, but no config file ever backed it
// (caught 2026-07-27 while verifying checkpoint 3.3.3 end-to-end - CI's `typescript` job only ran
// `npm test`, never `npm run lint`, so the gap was silent). `generated/` is excluded: it's
// auto-generated output (codegen/generate.mjs), never hand-edited, and re-linting it would just be
// linting json-schema-to-zod's own output.
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

const config = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  globalIgnores(["node_modules/**", "dist/**", "generated/**", "*.tsbuildinfo"]),
  {
    files: ["**/*.{ts,mjs}"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
]);

export default config;
