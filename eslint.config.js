// ESLint's rules for the site's code (spec: quality-check; lint-gates design D2). scripts/check.py
// runs `eslint .` after `npm ci`. A rule turned off here carries its reason beside it: this file is
// the recorded baseline troupe-run/infrastructure#323 allows.
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // What git ignores, and what the site writes or syncs rather than holds as source.
    ignores: [
      'dist/**',
      'dist-fixture/**',
      '.astro/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'public/**',
      'src/generated/**',
      'src/content/docs/docs/**',
      '.cache/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    // Node: the build scripts, the configs and the tests.
    files: ['scripts/**', 'tests/**', '*.config.*', '*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // The browser: the site's own client scripts.
    files: ['src/scripts/**', 'src/**/*.astro'],
    languageOptions: { globals: { ...globals.browser } },
  },
);
