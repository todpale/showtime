import * as globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import * as vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import stylistic from '@stylistic/eslint-plugin'
import playwright from 'eslint-plugin-playwright'
import perfectionist from 'eslint-plugin-perfectionist'

export default [
  {
    ignores: [
      '.output/**',
      'dist/**',
      'coverage/**',
      'artifacts/**',
      '.data/**'
    ]
  },
  ...pluginVue.configs['flat/strongly-recommended'],
  {
    files: ['e2e/**'],
    plugins: { playwright },
    rules: {
      ...playwright.configs['flat/recommended'].rules
    }
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: vueParser,
      parserOptions: {
        parser: tsParser
      },
      globals: {
        ...globals.browser
      }
    },
    files: ['**/*.{js,ts,vue,mjs,mts}'],
    plugins: {
      perfectionist,
      'vue': pluginVue,
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/no-tabs': 'off',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/array-element-newline': ['error', { consistent: true, minItems: 5 }],
      '@stylistic/max-len': ['error', { code: 120, ignoreComments: true, ignoreRegExpLiterals: true }],
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/brace-style': 'error',
      curly: 'error',
      'comma-dangle': ['error', 'never'],
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          ignoreRestSiblings: true
        }
      ],
      'no-undef': 'off',
      'vue/attributes-order': [
        'error',
        {
          order: [
            'CONDITIONALS',
            'DEFINITION',
            'GLOBAL',
            'LIST_RENDERING',
            'UNIQUE',
            'TWO_WAY_BINDING',
            'OTHER_DIRECTIVES',
            'RENDER_MODIFIERS',
            'SLOT',
            'ATTR_DYNAMIC',
            'ATTR_STATIC',
            'ATTR_SHORTHAND_BOOL',
            'CONTENT',
            'EVENTS'
          ]
        }
      ],
      'vue/no-v-html': 0,
      'vue/block-order': [
        'error',
        {
          order: ['template', 'script', 'style']
        }
      ],
      'vue/padding-line-between-tags': [
        'error',
        [{
          blankLine: 'always',
          prev: '*',
          next: '*'
        }]
      ],
      'perfectionist/sort-object-types': [
        'error',
        {
          type: 'line-length',
          order: 'asc'
        }
      ],
      'perfectionist/sort-interfaces': [
        'error',
        {
          type: 'line-length',
          order: 'asc'
        }
      ],
      'perfectionist/sort-intersection-types': [
        'error',
        {
          type: 'line-length',
          order: 'asc'
        }
      ],
      'perfectionist/sort-named-exports': [
        'error',
        {
          type: 'line-length',
          order: 'asc'
        }
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          type: 'line-length',
          order: 'asc'
        }
      ],
      'perfectionist/sort-exports': [
        'error',
        {
          type: 'line-length',
          order: 'asc'
        }
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'line-length',
          order: 'asc',
          groups: []
        }
      ]
    },
    ignores: [
      'dist/**',
      '.output/**',
      'node_modules/**',
      'artifacts/**',
      'coverage/**'
    ]
  }
]
