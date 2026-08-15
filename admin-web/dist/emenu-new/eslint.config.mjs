import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginReact from 'eslint-plugin-react'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import babelParser from '@babel/eslint-parser'

/** @type {import('eslint').Linter.Config[]} */
export default [
  /* 全局检查文件 */
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ['@babel/preset-env', '@babel/preset-react'],
        },
      },
    },
  },
  /* 全局忽略文件 */
  {
    ignores: [
      '**/*.config.js',
      'coverage/**',
      'public/**',
      'build/**',
      '.yarn/**',
      '!**/eslint.config.js',
    ],
  },
  /* window下的全局变量 */
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  pluginJs.configs.recommended,
  /* 如果不需要自定义plugin规则 用默认的就行 */
  {
    plugins: {
      react: pluginReact,
    },
    languageOptions: {
      ...pluginReact.configs.recommended.languageOptions,
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 0,
      'react/prop-types': 0,
      //'react/no-unknown-property': 0,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  eslintPluginPrettierRecommended,
  {
    rules: {
      'no-prototype-builtins': 'off',
    },
  },
]
