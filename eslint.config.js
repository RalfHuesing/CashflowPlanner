import globals from 'globals';

export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    ignores: ['node_modules/**'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-compare-neg-zero': 'error',
      'no-dupe-args': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-extra-boolean-cast': 'error',
      'no-fallthrough': 'error',
      'no-global-assign': 'error',
      'no-import-assign': 'error',
      'no-irregular-whitespace': 'error',
      'no-self-assign': 'error',
      'no-shadow-restricted-names': 'error',
      'no-undef': 'error',
      'no-unexpected-multiline': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-catch': 'error',
      'no-useless-return': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'complexity': ['warn', { max: 20 }],
      'max-depth': ['warn', 5]
    }
  }
];
