module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    "no-unused-vars": 'off',
    "no-case-declarations": "off",
    "no-useless-escape": "off",
    "no-cond-assign": "warn"
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
