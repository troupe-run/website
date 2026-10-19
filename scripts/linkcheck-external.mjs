// Weekly external link check over a built site. A broken link fails the run, writes the job summary, and opens
// or updates one tracking issue; a clean run closes it. When it opens or comments on the issue, it hands the issue's
// URL to the workflow's board job as the `issue-url` output. EXTRA_URL, set by a run started by hand, adds one more
// URL to check, so the issue path can be proved without breaking the site. Outside GitHub Actions it only prints what
// it would do. The decisions are in linkcheck-external-lib.mjs; this file runs linkinator and gh.
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runLinkinator, summarise } from './linkinator-lib.mjs';
import { EXTERNAL_SKIPS } from './external-skips.mjs';
import {
  EXTRA_URL_PAGE, TRACKING_TITLE, boardIssueUrl, decide, exitCode, extraUrlPage, extraUrlProblem, formatReport,
  matchTrackingIssues, sitePath,
} from './linkcheck-external-lib.mjs';

const dir = process.argv[2] ?? 'dist';
// Retry 429s that send retry-after, and 5xx or no response up to 3 times; give up on a request after 15 s.
const RETRIES = ['--retry', '--retry-errors', '--retry-errors-count', '3', '--retry-errors-jitter', '3000', '--timeout', '15000'];
const { EXTRA_URL, GITHUB_ACTIONS, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
const runUrl = GITHUB_RUN_ID ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : '(local run)';

const skips = EXTERNAL_SKIPS.map((s) => s.pattern);
const extraProblem = extraUrlProblem(EXTRA_URL, EXTERNAL_SKIPS);
if (extraProblem) {
  console.error(`✗ ${extraProblem}`);
  if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `## External links\n\nNot run: ${extraProblem}\n\nRun: ${runUrl}\n`);
  process.exit(1);
}

const run = runLinkinator(dir, skips, RETRIES);
if (EXTRA_URL && !run.error) {
  // linkinator only reaches pages linked from the site's index, and two paths break its local links, so the page
  // holding extra-url gets a run of its own, with the same skips and retries, merged into the site's result.
  const page = join(dir, EXTRA_URL_PAGE);
  try {
    mkdirSync(page, { recursive: true });
    writeFileSync(join(page, 'index.html'), extraUrlPage(EXTRA_URL));
    const extra = runLinkinator(page, skips, RETRIES);
    if (extra.error) Object.assign(run, { result: undefined }, extra);
    else run.result.links = [...run.result.links, ...extra.result.links];
  } finally {
    rmSync(page, { recursive: true, force: true });
  }
}
const crashed = Boolean(run.error);
const summarised = crashed ? { broken: [], external: 0 } : summarise(run.result);
// Broken local paths are CI's internal check's job; this check and its issue are about external links only.
const broken = summarised.broken.filter((l) => /^https?:\/\//.test(l.url));
const { external } = summarised;

if (crashed) {
  console.error(run.stdout, run.stderr);
  console.error(`✗ ${run.error}`);
} else {
  console.log(`Checked ${external} external links in ${dir} (${EXTERNAL_SKIPS.length} skip pattern(s))`);
  for (const l of broken) console.error(`✗ ${l.status || 'no response'} ${l.url} (on ${sitePath(l.parent, dir)})`);
  if (external === 0) console.error('✗ checked no external links: the external link check is not checking anything');
}

const summary = crashed ? `The external link check failed to run: ${run.error}.\n\nRun: ${runUrl}`
  : external === 0 ? `The external link check checked no external links, so it proves nothing.\n\nRun: ${runUrl}`
  : formatReport({ broken, external, runUrl, dir });
if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `## External links\n\n${summary}\n`);

const gh = (...args) => {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`gh ${args[0]} ${args[1]} failed: ${r.stderr.trim()}`);
  return r.stdout;
};

let reportFailed = false;
if (GITHUB_ACTIONS) {
  try {
    // List every open issue and filter in code. `--author` (or `--search`) goes through GitHub's search API, which
    // didn't return a bot-opened issue minutes after it was created, so the second run opened a duplicate.
    const listed = JSON.parse(gh('issue', 'list', '--state', 'open', '--limit', '1000',
      '--json', 'number,title,author,createdAt,state,url'));
    const openIssues = matchTrackingIssues(listed);
    if (openIssues.length > 1) console.warn(`! ${openIssues.length} open "${TRACKING_TITLE}" issues; updating #${openIssues[0].number}, the oldest`);
    const decision = decide({ broken, external, crashed, openIssues });
    const body = formatReport({ broken, external, runUrl, dir, forIssue: true });
    let openedUrl = '';
    if (decision.action === 'open') { openedUrl = gh('issue', 'create', '--title', TRACKING_TITLE, '--label', 'bug', '--body', body).trim(); console.log(`Opened ${openedUrl}`); }
    if (decision.action === 'comment') { gh('issue', 'comment', String(decision.issue.number), '--body', body); console.log(`Commented on #${decision.issue.number}`); }
    if (decision.action === 'close') {
      gh('issue', 'close', String(decision.issue.number), '--comment', `A clean run found no broken external links (${external} checked): ${runUrl}`);
      console.log(`Closed #${decision.issue.number}`);
    }
    if (decision.action === 'none') console.log('Tracking issue: nothing to do');
    // The board job (links-weekly.yml) adds this issue to the roadmap board. It runs only when this output is set.
    const issueUrl = boardIssueUrl({ decision, openedUrl });
    if (issueUrl && GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `issue-url=${issueUrl}\n`);
  } catch (e) {
    reportFailed = true;
    console.error(`✗ could not update the tracking issue: ${e.message}`);
  }
} else {
  console.log(`Not in GitHub Actions: the tracking issue would get "${decide({ broken, external, crashed, openIssues: [] }).action}" (assuming none is open)`);
}

const code = exitCode({ broken, external, crashed, reportFailed });
if (!code) console.log('✓ no broken external links');
process.exit(code);
