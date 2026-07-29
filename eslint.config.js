import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'server/dist/**',
      'server/coverage/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'tmp/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['server/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: { '@typescript-eslint/no-explicit-any': 'error', '@typescript-eslint/no-unused-vars': 'off' },
  },
  { files: ['**/*.spec.ts', '**/*.test.ts'], languageOptions: { globals: { ...globals.node, ...globals.jest } } },
  { files: ['vite.config.ts', 'vitest.config.ts', 'playwright.config.ts'], languageOptions: { globals: globals.node } },
  { files: ['**/*.cjs'], languageOptions: { globals: globals.node } },
);
