import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import airbnb from 'eslint-config-airbnb-base';
import globals from 'globals';

export default [
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      parser: parser,
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      '@typescript-eslint': ts
    },
    rules: {
      ...js.configs.recommended.rules,
      ...airbnb.rules,
      ...ts.configs.recommended.rules,
      'no-console': 'warn',
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      'class-methods-use-this': 'off',
      'no-throw-literal': 'off'
    }
  }
];