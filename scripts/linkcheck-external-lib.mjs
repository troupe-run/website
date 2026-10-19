// The weekly external link check's decisions, kept pure so they can be tested without GitHub or the network.
// scripts/linkcheck-external.mjs runs linkinator and gh and carries these out.

export const TRACKING_TITLE = 'Broken external links';
// How `gh issue list --json author` names the GITHUB_TOKEN's bot.
export const WORKFLOW_AUTHOR = 'app/github-actions';
export const MAX_ROWS = 100;
// The page a run started by hand adds to the scan to hold its `extra-url`. Its path is the "Found on" in the report.
export const EXTRA_URL_PAGE = 'extra-url-input';

/**
 * @typedef {{ url: string, status?: number, state?: string, parent?: string }} Link  linkinator's JSON for one link
 * @typedef {{ number: number, title: string, createdAt: string, state?: string, url?: string, author?: { login: string } }} Issue
 */

/**
 * Open issues that are this check's tracking issue, oldest first. Matches the exact title and the workflow's bot.
 * @param {Issue[]} issues
 */
export function matchTrackingIssues(issues) {
  return issues
    .filter((i) => i.title === TRACKING_TITLE && i.author?.login === WORKFLOW_AUTHOR && (i.state ?? 'OPEN') === 'OPEN')
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

/**
 * What to do with the tracking issue. Only broken links open or comment; a clean run closes. A run that crashed or
 * checked no external links is a fault in the check, not news about links, so it leaves the issue alone.
 * @param {{ broken: Link[], external: number, crashed?: boolean, openIssues: Issue[] }} input
 * @returns {{ action: 'open' | 'comment' | 'close' | 'none', issue?: Issue }}
 */
export function decide({ broken, external, crashed, openIssues }) {
  if (crashed || external === 0) return { action: 'none' };
  const [issue] = openIssues;
  if (broken.length) return issue ? { action: 'comment', issue } : { action: 'open' };
  return issue ? { action: 'close', issue } : { action: 'none' };
}

/**
 * The issue the board job adds to the roadmap board: the one this run opened (the URL `gh issue create` printed) or
 * commented on. Empty for every other run, which leaves the board alone.
 * @param {{ decision: { action: string, issue?: Issue }, openedUrl?: string }} input
 */
export function boardIssueUrl({ decision, openedUrl = '' }) {
  if (decision.action === 'open') return openedUrl;
  if (decision.action === 'comment') return decision.issue?.url ?? '';
  return '';
}

/**
 * What's wrong with a run's `extra-url` input, or null when it can be checked. Empty means unset: check the site only.
 * Anything else that isn't an absolute http(s) URL, or that a skip would hide, is refused rather than ignored.
 * @param {string | undefined} value
 * @param {{ pattern: string, reason?: string }[]} skips
 */
export function extraUrlProblem(value, skips) {
  if (!value) return null;
  const fix = 'Start the run again with an absolute http(s) URL, such as https://troupe.run/definitely-not-here-404, or leave it empty.';
  let url;
  try { url = new URL(value); } catch { url = null; }
  if (!url || !['http:', 'https:'].includes(url.protocol)) {
    return `extra-url must be an absolute http(s) URL; got ${JSON.stringify(value)}. ${fix}`;
  }
  const skip = skips.find((s) => new RegExp(s.pattern).test(value));
  if (skip) return `extra-url ${JSON.stringify(value)} matches the skip pattern ${skip.pattern}, so checking it would prove nothing. ${fix}`;
  return null;
}

const escapeHtml = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * The page that holds a run's `extra-url`, so linkinator checks it like any link on the site.
 * @param {string} url
 */
export function extraUrlPage(url) {
  return `<!doctype html>\n<title>extra-url input</title>\n<a href="${escapeHtml(url)}">extra-url</a>\n`;
}

/**
 * 1 when any link is broken, nothing was checked, linkinator crashed, or reporting failed; otherwise 0.
 * @param {{ broken: Link[], external: number, crashed?: boolean, reportFailed?: boolean }} input
 */
export function exitCode({ broken, external, crashed, reportFailed }) {
  return crashed || reportFailed || external === 0 || broken.length ? 1 : 0;
}

/**
 * linkinator reports pages as paths on disk (`dist/docs/x/`); show them as the site path (`/docs/x/`).
 * @param {string | undefined} parent
 */
export function sitePath(parent, dir = 'dist') {
  if (!parent) return '(unknown)';
  const rel = parent === dir ? '' : parent.startsWith(`${dir}/`) ? parent.slice(dir.length + 1) : null;
  return rel === null ? parent : `/${rel}`;
}

const cell = (s) => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const status = (l) => (l.status ? String(l.status) : 'no response');

/**
 * The Markdown for the job summary, the issue body and its comments, so the three always agree. `forIssue` adds how
 * the issue closes.
 * @param {{ broken: Link[], external: number, runUrl: string, dir?: string, forIssue?: boolean }} input
 */
export function formatReport({ broken, external, runUrl, dir = 'dist', forIssue = false }) {
  const lines = [];
  if (!broken.length) {
    lines.push(`No broken external links: ${external} checked.`, '', `Run: ${runUrl}`);
    return lines.join('\n');
  }
  lines.push(`${broken.length} broken external link(s) out of ${external} checked.`, '');
  lines.push('| URL | Status | Found on |', '| --- | --- | --- |');
  for (const l of broken.slice(0, MAX_ROWS)) lines.push(`| ${cell(l.url)} | ${cell(status(l))} | ${cell(sitePath(l.parent, dir))} |`);
  if (broken.length > MAX_ROWS) lines.push('', `+${broken.length - MAX_ROWS} more, see the run.`);
  lines.push('', `Run: ${runUrl}`);
  if (!forIssue) return lines.join('\n');
  lines.push('', 'This issue is kept by the weekly external link check (`.github/workflows/links-weekly.yml`). It closes itself after a clean run; to close it sooner, fix the links and run the workflow by hand.');
  return lines.join('\n');
}
