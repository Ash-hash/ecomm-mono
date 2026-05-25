import nextPlugin from "@next/eslint-plugin-next";
import { globalIgnores } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const hooksPlugin = {
  ...reactHooks,
  rules: {
    ...reactHooks.rules,
    "set-state-in-effect": {
      meta: { schema: [] },
      create: () => ({}),
    },
  },
};

const eslintConfig = [
  nextPlugin.configs["core-web-vitals"],
  ...tseslint.configs.recommended,
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    plugins: {
      "jsx-a11y": jsxA11y,
      "react-hooks": hooksPlugin,
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
];

export default eslintConfig;
