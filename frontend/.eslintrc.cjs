module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    // This project is plain JavaScript with no prop-types dependency and,
    // by design, no TypeScript. Component contracts are documented by their
    // destructured parameters instead, so the rule is pure noise here.
    'react/prop-types': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      // Context modules intentionally export a provider component alongside
      // its hook and constants; that is the whole point of the module.
      files: ['src/context/*.jsx', 'src/components/ui/index.js'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
};
