// External URLs the weekly link check doesn't request. This list is the only place skips are defined, and every
// entry says why it's here: a skip hides a link from the check for good, so it needs a reason someone can check.
//
// Empty since 2026-10-16. github.com/troupe-run/troupe was skipped while that repository was private (design spec
// §10). gc.zgo.at was skipped with no recorded reason; fetching count.js answers 200 and records no visit
// (GoatCounter counts from the browser, through troupe-run.goatcounter.com/count), so it's checked.
//
// Entry shape: { pattern: 'regex matched against the full URL', reason: 'why it cannot be checked' }
export const EXTERNAL_SKIPS = [];

/** Returns what's wrong with a skip list: entries missing a pattern or reason, or with a pattern that won't compile. */
export function skipProblems(skips) {
  const problems = [];
  skips.forEach((s, i) => {
    if (typeof s?.pattern !== 'string' || !s.pattern.trim()) problems.push(`entry ${i}: no pattern`);
    if (typeof s?.reason !== 'string' || !s.reason.trim()) problems.push(`entry ${i}: no reason`);
    try {
      new RegExp(s?.pattern);
    } catch {
      problems.push(`entry ${i}: pattern is not a valid regex`);
    }
  });
  return problems;
}
