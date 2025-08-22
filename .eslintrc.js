module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended"],
  env: {
    node: true,
    es6: true,
    browser: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    // Basic rules that won't conflict with Prettier
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": "off",
  },
  ignorePatterns: [
    "node_modules/",
    "main.js",
    "*.d.ts",
    "test-vault/",
    "wdio-logs/",
    "screenshots/",
  ],
};
