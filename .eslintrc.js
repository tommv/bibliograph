module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
  },
  extends: ["eslint:recommended", "prettier", "prettier/react"],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    allowImportExportEverywhere: true,
  },
  rules: {
    "no-var": "error",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      extends: [
        "plugin:@typescript-eslint/recommended",
        "prettier/@typescript-eslint",
      ],
    },
  ],
};
