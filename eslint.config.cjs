module.exports = [
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ignores: ['**/dist/**', '**/node_modules/**', '.yarn/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
