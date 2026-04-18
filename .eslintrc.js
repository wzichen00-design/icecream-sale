module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: 'standard',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    wx: 'readonly',
    App: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    getApp: 'readonly',
    getCurrentPages: 'readonly'
  },
  rules: {
    'no-unused-vars': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'camelcase': 'off',
    'no-new': 'off',
    'prefer-promise-reject-errors': 'off'
  },
  ignorePatterns: [
    'node_modules/',
    'miniprogram_npm/',
    'cloudfunctions/*/node_modules/'
  ]
};
