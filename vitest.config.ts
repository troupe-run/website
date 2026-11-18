/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // Off unless CI's test job turns it on (--coverage.enabled): the coverage gate measures what the unit tests reach
    // of the site's TypeScript and the tooling's .mjs. .astro files aren't measurable this way (quality-gates design
    // D3). The thresholds are in quality-gates.toml, not here.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'scripts/**/*.mjs'],
      exclude: ['scripts/tests/**', 'tests/**'],
      reporter: ['json-summary'],
    },
  },
});
