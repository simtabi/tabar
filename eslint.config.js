import js from '@eslint/js';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  CustomEvent: 'readonly',
  Element: 'readonly',
  HTMLElement: 'readonly',
  customElements: 'readonly',
  fetch: 'readonly',
  ReadableStream: 'readonly',
  Response: 'readonly',
  Date: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  __TABAR_VERSION__: 'readonly',
  process: 'readonly', // isomorphic guards (typeof process) in terminal/node entries
};

const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  URL: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
};

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: browserGlobals },
    rules: {
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['scripts/**/*.js', 'bin/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: nodeGlobals },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: browserGlobals },
  },
];
