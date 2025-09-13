// eslint.config.js

const globals = require('globals');
const js = require('@eslint/js');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // Basic ESLint configuration
  js.configs.recommended,

  // Configuration for the project
  {
    files: ['**/*.js', '**/*.jsx'], // Specify file extensions to lint
    languageOptions: {
      ecmaVersion: 2021, // ECMAScript version
      sourceType: 'script', // Treat files as scripts (CommonJS)
      globals: {
        ...globals.node, // Node.js global variables
        ...globals.jest, // Jest global variables
        ...globals.browser, // Browser global variables
      },
    },
    rules: {
      'no-console': 'warn', // Warn about console usage
      'no-var': 'error', // Disallow var
      'prefer-template': 'error', // Prefer template literals over string concatenation
      'no-redeclare': 'off', // Disable the 'no-redeclare' rule globally
    },
    ignores: ['node_modules', 'build', 'dist'], // Directories to ignore
  },

  // Integrate Prettier configuration
  prettierConfig,

  // Enable Prettier plugin to show Prettier errors as ESLint errors
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
