import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { e2ePort, fixturePreviewCommand, previewCommand } from './tests/e2e/port';

// Its own port, free when the run starts: never the dev (4321) server or another worktree's run, so a test can't
// silently run against a stale server. E2E_PORT chooses one.
const PORT = e2ePort();
// The version tests run on the fixture build (troupe with releases; versioned-docs design D9), on a port of its own.
// It's served, never built here: a build would rewrite the pages the main server's build is reading.
const FIXTURE_PORT = e2ePort(process.env, 'E2E_FIXTURE_PORT', PORT);
if (!existsSync('dist-fixture/troupe-docs.json')) {
  throw new Error('dist-fixture/ has no fixture build, which the version tests need. Fix: run npm run build:fixture first.');
}

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  retries: process.env.CI ? 1 : 0,
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', testIgnore: 'versions.spec.ts', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${PORT}` } },
    { name: 'versions', testMatch: 'versions.spec.ts', use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${FIXTURE_PORT}` } },
  ],
  webServer: [
    { command: previewCommand(PORT), url: `http://localhost:${PORT}/`, reuseExistingServer: false, timeout: 180_000 },
    { command: fixturePreviewCommand(FIXTURE_PORT), url: `http://localhost:${FIXTURE_PORT}/`, reuseExistingServer: false, timeout: 180_000 },
  ],
});
