import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { unaccepted, type Accepted } from '../e2e/axe';

// tests/e2e/axe.ts takes accepted findings out of axe's results, one rule on one node (spec: accessibility;
// axe-core-4-14 design D2). These cases are the spec's scenarios on hand-made results, so none needs the site broken.
const SEARCH = 'button[data-open-modal=""]';
const ACCEPTED: Accepted[] = [{ rule: 'label-content-name-mismatch', target: SEARCH, page: '/docs/', why: 'test' }];
const violation = (id: string, ...targets: string[]) => ({ id, impact: 'serious', nodes: targets.map((t) => ({ target: [t] })) });

describe('unaccepted() excuses one rule on one node, and nothing else', () => {
  it('drops the accepted rule on the accepted node, and the violation it leaves empty', () => {
    expect(unaccepted([violation('label-content-name-mismatch', SEARCH)], ACCEPTED)).toEqual([]);
  });

  it('keeps the accepted rule on another node', () => {
    expect(unaccepted([violation('label-content-name-mismatch', 'a.other')], ACCEPTED)).toEqual(['label-content-name-mismatch: a.other']);
  });

  it('keeps another rule on the accepted node', () => {
    expect(unaccepted([violation('button-name', SEARCH)], ACCEPTED)).toEqual([`button-name: ${SEARCH}`]);
  });

  it('keeps the accepted rule on the node under a changed selector', () => {
    expect(unaccepted([violation('label-content-name-mismatch', 'button[data-open-modal]')], ACCEPTED)).toEqual([
      'label-content-name-mismatch: button[data-open-modal]',
    ]);
  });

  it('keeps the other nodes of a violation that includes the accepted node', () => {
    expect(unaccepted([violation('label-content-name-mismatch', SEARCH, 'a.other')], ACCEPTED)).toEqual(['label-content-name-mismatch: a.other']);
  });

  it('joins a node target inside a frame with spaces, as the axe tests always have', () => {
    const framed = { id: 'button-name', impact: 'critical', nodes: [{ target: ['iframe', 'button'] }] };
    expect(unaccepted([framed], ACCEPTED)).toEqual(['button-name: iframe button']);
  });

  it('ignores minor and moderate violations', () => {
    const v = (impact: string) => ({ ...violation('region', 'div'), impact });
    expect(unaccepted([v('minor'), v('moderate')], ACCEPTED)).toEqual([]);
  });
});

// Every axe test goes through the helper, so every one applies the list. A text check, like e2e-clock.test.ts: it
// catches a test copied from the old pattern, not someone determined to get round it.
const E2E = 'tests/e2e';
const HELPER = 'axe.ts';
const files = readdirSync(E2E, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.ts'));

describe('e2e tests run axe only through tests/e2e/axe.ts', () => {
  it('reads the e2e files, including the ones that run axe', () => {
    expect(files).toEqual(expect.arrayContaining(['a11y.spec.ts', 'versions.spec.ts', HELPER]));
  });

  it(`no file under ${E2E}/ other than ${HELPER} imports @axe-core/playwright`, () => {
    const offenders = files.filter((f) => f !== HELPER && readFileSync(join(E2E, f), 'utf8').includes('@axe-core/playwright'));
    expect(offenders, `run axe through ./axe instead of importing @axe-core/playwright in: ${offenders.join(', ')}`).toEqual([]);
  });
});
