module.exports = {
  env: { es2022: true, node: true, browser: true },
  extends: ["eslint:recommended"],
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-console": ["warn", { allow: ["error", "warn"] }],
  },
  overrides: [
    {
      files: ["apps/frontend/**/*.{js,jsx}"],
      parser: "@babel/eslint-parser",
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
      plugins: ["react"],
      rules: {
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        "no-console": ["warn", { allow: ["error", "warn"] }],
      },
    },
  ],
};
