import { execFileSync } from 'node:child_process';

// The e2e suite's port, resolved once per run (design D11). Every commit runs the suite, so two worktrees running it
// at once is ordinary: each run takes a port that's free when it starts. Playwright loads its config again in each
// worker; writing the port back to E2E_PORT, which the workers inherit, gives them all the same one.
// The fixture build's server has its own, E2E_FIXTURE_PORT, chosen the same way (versioned-docs design D9).
export function e2ePort(env: Record<string, string | undefined> = process.env, name = 'E2E_PORT', avoid?: number): number {
  const set = env[name];
  if (set === undefined) {
    let port = freePort();
    while (port === avoid) port = freePort();
    env[name] = String(port);
    return port;
  }
  // Set but malformed is an error, never a fall-through to a free port.
  const port = /^\d+$/.test(set) ? Number(set) : NaN;
  if (!(port >= 1024 && port <= 65535)) {
    throw new Error(
      `${name} is ${JSON.stringify(set)}, which isn't a port from 1024 to 65535. ` +
        'Fix: set it to one, or unset it to use a free port.',
    );
  }
  return port;
}

// Playwright loads its config synchronously, and finding a free port in Node is asynchronous, so a short child
// process asks the OS for one. If another process takes it before Astro binds it, Playwright refuses to start
// (reuseExistingServer: false), so the run fails rather than testing another site.
function freePort(): number {
  const script =
    "const s = require('node:net').createServer();" +
    's.listen(0, () => { process.stdout.write(String(s.address().port)); s.close(); });';
  return Number(execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' }));
}

// --ignore-lock keeps the server in the foreground under a coding agent, where Astro 7 would otherwise background it
// and Playwright would see its process exit (design D11).
export function previewCommand(port: number): string {
  return `npm run build && astro preview --port ${port} --ignore-lock`;
}

/** Serves the fixture build (npm run build:fixture) without building: a build here would sync troupe's pages into
 *  the folder the real build is reading at the same time. */
export function fixturePreviewCommand(port: number): string {
  return `astro preview --outDir dist-fixture --port ${port} --ignore-lock`;
}
