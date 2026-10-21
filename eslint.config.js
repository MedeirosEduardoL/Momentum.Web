import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const layer = (type, pattern) => ({ type, pattern });

const layerPolicy = (from, allowed) => ({
  from: { element: { type: from } },
  allow: { to: { element: { types: { anyOf: allowed } } } },
});

const deepImportPatterns = [
  {
    group: ["@/pages/*/*", "@/widgets/*/*", "@/features/*/*"],
    message: "Importe o slice pela public API (index.ts), sem deep import.",
  },
];

const radixPattern = {
  group: ["@radix-ui/*"],
  message: "Radix só entra dentro de src/shared/ui.",
};

export default defineConfig(
  globalIgnores(["dist", "coverage", "src/shared/api/generated"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      boundaries,
      unicorn,
    },
    settings: {
      "boundaries/elements": [
        layer("app", "src/app"),
        layer("pages", "src/pages/*"),
        layer("widgets", "src/widgets"),
        layer("features", "src/features/*"),
        layer("shared", "src/shared"),
      ],
      "boundaries/ignore": ["src/main.tsx", "src/test/**"],
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      "no-console": "error",
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            layerPolicy("app", ["app", "pages", "widgets", "features", "shared"]),
            layerPolicy("pages", ["widgets", "features", "shared"]),
            layerPolicy("widgets", ["widgets", "features", "shared"]),
            layerPolicy("features", ["features", "shared"]),
            layerPolicy("shared", ["shared"]),
          ],
        },
      ],
      "no-restricted-imports": ["error", { patterns: [...deepImportPatterns, radixPattern] }],
    },
  },
  {
    files: ["src/app/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["src/shared/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: deepImportPatterns }],
    },
  },
  {
    files: ["*.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier
);
