import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  boardIssueUrl, decide, exitCode, extraUrlPage, extraUrlProblem, formatReport, matchTrackingIssues, sitePath,
  TRACKING_TITLE, MAX_ROWS,
} from '../../scripts/linkcheck-external-lib.mjs';
import { summarise } from '../../scripts/linkinator-lib.mjs';

// Real linkinator output: a 404, an unresolvable host and a working link.
const real = JSON.parse(readFileSync(new URL('fixtures/linkinator-broken.json', import.meta.url), 'utf8'));
const { broken } = summarise(real);
// The author shape is copied from `gh issue view --json author` on a real issue opened by GitHub Actions.
const bot = { login: 'app/github-actions', is_bot: true };
const issue = (number: number, createdAt: string, over = {}) =>
  ({ number, title: TRACKING_TITLE, author: bot, createdAt, state: 'OPEN', ...over });
const RUN = 'https://github.com/troupe-run/website/actions/runs/1';

describe('decide', () => {
  it('opens an issue when links are broken and no tracking issue is open', () => {
    expect(decide({ broken, external: 3, openIssues: [] })).toEqual({ action: 'open' });
  });

  it('comments on the open tracking issue when links are still broken', () => {
    const open = issue(7, '2026-10-01T00:00:00Z');
    expect(decide({ broken, external: 3, openIssues: [open] })).toEqual({ action: 'comment', issue: open });
  });

  it('comments on the first (oldest) of two matching issues and never opens a third', () => {
    const issues = matchTrackingIssues([issue(9, '2026-10-08T00:00:00Z'), issue(7, '2026-10-01T00:00:00Z')]);
    expect(decide({ broken, external: 3, openIssues: issues })).toEqual({ action: 'comment', issue: issues[0] });
    expect(issues[0].number).toBe(7);
  });

  it('closes the open tracking issue when a run finds nothing broken', () => {
    const open = issue(7, '2026-10-01T00:00:00Z');
    expect(decide({ broken: [], external: 75, openIssues: [open] })).toEqual({ action: 'close', issue: open });
  });

  it('does nothing when a run finds nothing broken and no issue is open', () => {
    expect(decide({ broken: [], external: 75, openIssues: [] })).toEqual({ action: 'none' });
  });

  it('leaves the issue alone when no external links were checked, even with an issue open', () => {
    expect(decide({ broken: [], external: 0, openIssues: [issue(7, '2026-10-01T00:00:00Z')] })).toEqual({ action: 'none' });
  });

  it('leaves the issue alone when linkinator crashed', () => {
    expect(decide({ broken: [], external: 0, crashed: true, openIssues: [] })).toEqual({ action: 'none' });
  });
});

describe('matchTrackingIssues', () => {
  it('keeps only open issues with the exact title opened by the workflow bot, oldest first', () => {
    const issues = [
      issue(1, '2026-10-05T00:00:00Z'),
      issue(2, '2026-10-01T00:00:00Z', { title: `${TRACKING_TITLE} (old)` }),
      issue(3, '2026-10-01T00:00:00Z', { author: { login: 'martin-at-hpsgd', is_bot: false } }),
      issue(4, '2026-10-02T00:00:00Z', { state: 'CLOSED' }),
      issue(5, '2026-10-03T00:00:00Z'),
    ];
    expect(matchTrackingIssues(issues).map((i: { number: number }) => i.number)).toEqual([5, 1]);
  });
});

describe('exitCode', () => {
  it('is 0 only when links were checked, none is broken, nothing crashed and reporting worked', () => {
    expect(exitCode({ broken: [], external: 75 })).toBe(0);
  });
  it('is 1 when a link is broken', () => expect(exitCode({ broken, external: 3 })).toBe(1));
  it('is 1 when no external link was checked', () => expect(exitCode({ broken: [], external: 0 })).toBe(1));
  it('is 1 when linkinator crashed', () => expect(exitCode({ broken: [], external: 75, crashed: true })).toBe(1));
  it('is 1 when updating the issue failed, even with no broken links', () =>
    expect(exitCode({ broken: [], external: 75, reportFailed: true })).toBe(1));
});

describe('sitePath', () => {
  it('turns linkinator paths on disk into site paths', () => {
    expect(sitePath('dist')).toBe('/');
    expect(sitePath('dist/docs/the-company/flows/')).toBe('/docs/the-company/flows/');
    expect(sitePath(undefined)).toBe('(unknown)');
  });
});

describe('formatReport', () => {
  it('lists each broken link with its status and the page it is on, and links the run', () => {
    const md = formatReport({ broken, external: 3, runUrl: RUN });
    expect(md).toContain('| https://troupe.run/definitely-not-here-404 | 404 | / |');
    expect(md).toContain('| https://no-such-host.invalid/ | no response | / |');
    expect(md).toContain('2 broken external link(s) out of 3 checked.');
    expect(md).toContain(`Run: ${RUN}`);
  });

  it('adds how the issue closes, and no hand-add note, only for the issue', () => {
    expect(formatReport({ broken, external: 3, runUrl: RUN })).not.toContain('closes itself');
    const md = formatReport({ broken, external: 3, runUrl: RUN, forIssue: true });
    expect(md).toContain('closes itself after a clean run');
    expect(md).not.toMatch(/by hand.*board|board.*by hand/i);
  });

  it('escapes a | in a URL so it does not split the table row', () => {
    const md = formatReport({ broken: [{ url: 'https://example.com/a|b', status: 404, parent: 'dist' }], external: 1, runUrl: RUN });
    expect(md).toContain('| https://example.com/a\\|b | 404 | / |');
  });

  it(`shows at most ${MAX_ROWS} rows and says how many more there are`, () => {
    const many = Array.from({ length: MAX_ROWS + 1 }, (_, i) => ({ url: `https://example.com/${i}`, status: 404, parent: 'dist' }));
    const md = formatReport({ broken: many, external: 200, runUrl: RUN });
    expect(md.split('\n').filter((l) => l.startsWith('| https://'))).toHaveLength(MAX_ROWS);
    expect(md).toContain('+1 more, see the run.');
  });

  it('says how many links were checked when none is broken', () => {
    expect(formatReport({ broken: [], external: 75, runUrl: RUN })).toBe(`No broken external links: 75 checked.\n\nRun: ${RUN}`);
  });
});

describe('boardIssueUrl', () => {
  const URL18 = 'https://github.com/troupe-run/website/issues/18';
  it('is the URL gh printed when the run opened the issue', () =>
    expect(boardIssueUrl({ decision: { action: 'open' }, openedUrl: URL18 })).toBe(URL18));
  it('is the matched issue\'s url when the run commented on it', () =>
    expect(boardIssueUrl({ decision: { action: 'comment', issue: issue(18, '2026-10-19T00:00:00Z', { url: URL18 }) } })).toBe(URL18));
  it('is empty when the run closed the issue or had nothing to do', () => {
    expect(boardIssueUrl({ decision: { action: 'close', issue: issue(18, '2026-10-19T00:00:00Z', { url: URL18 }) } })).toBe('');
    expect(boardIssueUrl({ decision: { action: 'none' } })).toBe('');
  });
  it('is empty when the run opened the issue but gh printed no URL', () =>
    expect(boardIssueUrl({ decision: { action: 'open' }, openedUrl: '' })).toBe(''));
});

describe('extraUrlProblem', () => {
  it('accepts an empty or missing extra-url, which means check the site only', () => {
    expect(extraUrlProblem('', [])).toBeNull();
    expect(extraUrlProblem(undefined, [])).toBeNull();
  });
  it('accepts an absolute https URL that no skip matches', () =>
    expect(extraUrlProblem('https://troupe.run/definitely-not-here-404', [])).toBeNull());
  it.each(['troupe.run/x', 'ftp://troupe.run/x', '/docs/', 'not a url'])(
    'refuses %s, naming extra-url and the value', (value) => {
      const problem = extraUrlProblem(value, []);
      expect(problem).toContain('extra-url');
      expect(problem).toContain(JSON.stringify(value));
      expect(problem).toContain('absolute http(s) URL');
    });
  it('refuses a URL a skip pattern matches, naming the pattern', () => {
    const problem = extraUrlProblem('https://example.com/a', [{ pattern: 'example\\.com', reason: 'test' }]);
    expect(problem).toContain('extra-url');
    expect(problem).toContain('example\\.com');
  });
});

describe('extraUrlPage', () => {
  it('holds exactly one link, to the URL', () => {
    const html = extraUrlPage('https://troupe.run/definitely-not-here-404');
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('<a href="https://troupe.run/definitely-not-here-404">');
  });
  it('escapes ", &, < and > in the URL so it stays one attribute value', () => {
    const html = extraUrlPage('https://x.test/?a="b"&c=<d>');
    expect(html).toContain('href="https://x.test/?a=&quot;b&quot;&amp;c=&lt;d&gt;"');
    expect(html.match(/<a /g)).toHaveLength(1);
  });
});
