import { describe, it, expect } from 'vitest';
import { createServer } from 'node:net';
import { e2ePort, previewCommand, fixturePreviewCommand } from '../e2e/port';

function listensOn(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, () => server.close(() => resolve(true)));
  });
}

describe('e2ePort', () => {
  it('picks a port that can be listened on when E2E_PORT is unset, and writes it back for the workers', async () => {
    const env: Record<string, string | undefined> = {};
    const port = e2ePort(env);
    expect(port).toBeGreaterThanOrEqual(1024);
    expect(env.E2E_PORT).toBe(String(port));
    expect(await listensOn(port)).toBe(true);
  });

  it('uses E2E_PORT when it names a port', () => {
    expect(e2ePort({ E2E_PORT: '4329' })).toBe(4329);
  });

  for (const value of ['abc', '', '80', '70000', '4329.5', ' 4329']) {
    it(`refuses E2E_PORT=${JSON.stringify(value)}, naming the variable, the value and the valid range`, () => {
      expect(() => e2ePort({ E2E_PORT: value })).toThrow(
        new RegExp(`E2E_PORT.*${JSON.stringify(value).replace(/[.]/g, '\\.')}.*1024 to 65535`),
      );
    });
  }
});

describe('e2ePort for the fixture server', () => {
  it('reads and writes E2E_FIXTURE_PORT, and never picks the main port', () => {
    const env: Record<string, string | undefined> = {};
    const main = e2ePort(env);
    const fixture = e2ePort(env, 'E2E_FIXTURE_PORT', main);
    expect(fixture).not.toBe(main);
    expect(env.E2E_FIXTURE_PORT).toBe(String(fixture));
  });

  it('refuses a malformed E2E_FIXTURE_PORT, naming it', () => {
    expect(() => e2ePort({ E2E_FIXTURE_PORT: 'abc' }, 'E2E_FIXTURE_PORT')).toThrow(/^E2E_FIXTURE_PORT is "abc"/);
  });
});

describe('fixturePreviewCommand', () => {
  it('serves dist-fixture/ without building it', () => {
    expect(fixturePreviewCommand(4340)).toBe('astro preview --outDir dist-fixture --port 4340 --ignore-lock');
  });
});

describe('previewCommand', () => {
  // --ignore-lock is what stops Astro 7 backgrounding the server under a coding agent, which made Playwright
  // report "exited early" (design D11). That it works there is checked by running the suite in an agent session
  // (task 3.4), not here.
  it('builds, then serves on the port with --ignore-lock', () => {
    expect(previewCommand(4339)).toBe('npm run build && astro preview --port 4339 --ignore-lock');
  });
});
