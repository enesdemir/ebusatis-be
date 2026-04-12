module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Stage 1: 'warn' now so the linter reports violations without
    // breaking the build. Stage 7 will flip this to 'error' and add
    // --max-warnings=0 to CI so no new violations can be merged.
    '@typescript-eslint/no-explicit-any': 'warn',

    // Detect hardcoded Turkish strings in source files. Migrations and
    // seeders are exempt because they contain legitimate locale data.
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'Literal[value=/[ığşöçüİĞŞÖÇÜ]/i]',
        message:
          'Hardcoded Turkish string detected. Use error codes (ErrorCode enum) and i18n keys instead.',
      },
      {
        selector: "CallExpression[callee.name='alert']",
        message: 'alert() is forbidden. Use toast or ConfirmDialog.',
      },
    ],
  },
  overrides: [
    {
      // Migrations and seeders contain legitimate locale data, entity
      // names in Turkish, and raw SQL — exempt them from the Turkish
      // string detection rule.
      files: ['src/migrations/**/*.ts', 'src/seeders/**/*.ts'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
    {
      // Test files frequently use `any` for mock objects; downgrade the
      // warning so test authoring stays frictionless while the rule is
      // still in 'warn' mode for production code.
      files: ['**/*.spec.ts', '**/*.test.ts', 'test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
