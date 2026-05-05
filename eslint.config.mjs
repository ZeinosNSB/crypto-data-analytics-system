import nx from '@nx/eslint-plugin'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'
import stylisticPlugin from '@stylistic/eslint-plugin'
import importPlugin from 'eslint-plugin-import-x'
import nodePlugin from 'eslint-plugin-n'
import globals from 'globals'

export default [
  {
    ignores: ['**/dist', '**/out-tsc', '**/.nx/**']
  },
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2020,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.bunBuiltin
      }
    },
    plugins: {
      '@stylistic': stylisticPlugin,
      prettier: eslintPluginPrettier,
      'import-x': importPlugin,
      node: nodePlugin
    },
    rules: {
      // JavaScript rules
      'for-direction': 'error',
      'no-async-promise-executor': 'error',
      'no-case-declarations': 'error',
      'no-class-assign': 'error',
      'no-compare-neg-zero': 'error',
      'no-cond-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-constant-condition': 'error',
      'no-control-regex': 'error',
      'no-debugger': 'error',
      'no-delete-var': 'error',
      'no-dupe-else-if': 'error',
      'no-duplicate-case': 'error',
      'no-empty-character-class': 'error',
      'no-empty-pattern': 'error',
      'no-empty-static-block': 'error',
      'no-ex-assign': 'error',
      'no-extra-boolean-cast': 'error',
      'no-fallthrough': 'error',
      'no-global-assign': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-loss-of-precision': 'error',
      'no-misleading-character-class': 'error',
      'no-nonoctal-decimal-escape': 'error',
      'no-octal': 'error',
      'no-regex-spaces': 'error',
      'no-self-assign': 'error',
      'no-shadow': 'warn',
      'no-shadow-restricted-names': 'error',
      'no-sparse-arrays': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-unused-labels': 'error',
      'no-unused-private-class-members': 'error',
      'no-useless-backreference': 'error',
      'no-useless-catch': 'error',
      'no-useless-escape': 'error',
      'no-var': 'error',
      'no-with': 'error',
      'prefer-const': 'error',
      'require-yield': 'error',
      'sort-imports': ['error', { ignoreDeclarationSort: true }],
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // TypeScript rules
      '@typescript-eslint/array-type': ['error', { default: 'generic', readonly: 'generic' }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': false, 'ts-ignore': 'allow-with-description' }
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
          custom: { regex: '^([A-Z]|T[A-Z][A-Za-z]+)$', match: true }
        }
      ],
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true }],
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/triple-slash-reference': 'error',

      // Import rules
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-commonjs': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],

      // Node rules
      'node/prefer-node-protocol': 'error',

      // Stylistic rules
      '@stylistic/spaced-comment': 'error',

      // Prettier
      'prettier/prettier': ['warn', { usePrettierConfig: true }],

      // Nx rules
      '@nx/enforce-module-boundaries': [
        'error',
        {
          allowCircularSelfDependency: true
        }
      ]
    }
  },
  /**
   * Ingestion collector: plain Node/CommonJS (`require`), không nằm trong TS project của apps.
   * Phải có tsconfig chứa file JS để `parserOptions.projectService` của typescript-eslint không fail.
   */
  {
    files: ['ingestion/collector/**/*.js'],
    rules: {
      'import-x/no-commonjs': 'off'
    }
  }
]
