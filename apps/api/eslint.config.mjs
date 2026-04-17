import baseConfig from '../../eslint.config.mjs'

import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  js.configs.recommended,
  ...baseConfig,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        fetch: false,
        Response: false,
        Request: false,
        addEventListener: false
      },

      ecmaVersion: 2021,
      sourceType: 'module'
    },

    rules: {
      curly: ['error', 'all'],
      'no-debugger': ['error'],
      'no-empty': [
        'warn',
        {
          allowEmptyCatch: true
        }
      ],
      'no-process-exit': 'off',
      'no-useless-escape': 'off',
      'prefer-const': [
        'warn',
        {
          destructuring: 'all'
        }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports'
        }
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: ['arrowFunctions']
        }
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-var-requires': 'off'
    }
  }
]
