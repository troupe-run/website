// The weekly external link check's decisions, kept pure so they can be tested without GitHub or the network.
// scripts/linkcheck-external.mjs runs linkinator and gh and carries these out.

export const TRACKING_TITLE = 'Broken external links';
// How `gh issue list --json author` names the GITHUB_TOKEN's bot.
export const WORKFLOW_AUTHOR = 'app/github-actions';
export const MAX_ROWS = 100;

/**
 * @typedef {{ url: string, status?: number, state?: string, parent?: string }} Link  linkinator's JSON for one link
 * @typedef {{ number: number, title: string, createdAt: string, state?: string, author?: { login: string } }} Issue
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
