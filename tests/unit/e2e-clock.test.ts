import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// clock.install() on its own leaves fake time running at real speed, which is the race in #37. tests/e2e/clock.ts
// installs and freezes it; every other e2e file goes through it (carousel-e2e-flake design D3). A text check: it
// catches a test copied from the old pattern, not someone determined to get round it.
const E2E = 'tests/e2e';
const HELPER = 'clock.ts';
const files = readdirSync(E2E, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.ts'));

describe('e2e tests fake the clock only through freezeClock()', () => {
  it('reads the e2e files, including the ones that use the clock', () => {
    expect(files).toEqual(expect.arrayContaining(['season-carousel.spec.ts', 'idle-bows.spec.ts', HELPER]));
  });

  it(`no file under ${E2E}/ other than ${HELPER} calls clock.install(`, () => {
    const offenders = files.filter((f) => f !== HELPER && readFileSync(join(E2E, f), 'utf8').includes('clock.install('));
    expect(offenders, `call freezeClock(page) from ./clock instead of page.clock.install() in: ${offenders.join(', ')}`).toEqual([]);
  });
});
