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
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "no-unused-vars": process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "no-case-declarations": "off",
    "no-useless-escape": "off",
    "no-cond-assign": "warn"
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
