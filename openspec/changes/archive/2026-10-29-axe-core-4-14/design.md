# Design

## Context

See proposal.md, "Why". Two test files run axe today, each with its own copy of the same code: `tests/e2e/a11y.spec.ts`
(nine pages of the main build, light and dark) and the version-menu block of `tests/e2e/versions.spec.ts` (two
pages of the fixture build, light and dark). Each builds `new AxeBuilder({ page }).withTags([...])`, keeps the
serious and critical violations, and expects the list of `rule: targets` strings to be empty. Both Playwright
projects use `devices['Desktop Chrome']` (1280×720), above Starlight's `md` breakpoint, so the shortcut hint is shown
and the rule fires.

On PR #58's run, the main build's axe tests failed on the one node, and nothing else failed. The check stops at the
first failing gate, so the fixture build's end-to-end tests never ran. Its docs pages have the same header, so its two
axe tests will hit the same node.

Starlight 0.42.5's `Search.astro` renders the button as `aria-label="Search"`, `aria-keyshortcuts="Control+K"`, an
icon, an `aria-hidden` span reading "Search", and an outer `<kbd>` holding `<kbd>Ctrl</kbd><kbd>K</kbd>`. An inline
script swaps in `⌘` and `Meta+K` when `navigator.platform` looks like a Mac, then shows the `<kbd>`. Local runs on
macOS see `⌘`, and CI on Linux sees `Ctrl`.

`@axe-core/playwright` 4.14.0 depends on `axe-core` `~4.14.0`. Both are 4.13.0 in the lockfile now.

## Goals / Non-Goals

**Goals:**
- One place says which axe findings the site accepts and why, and every axe test reads it.
- The exception can't widen silently, either to more nodes or past the reason it was granted, and can't outlive the
  finding it covers.

**Non-Goals:**
- Changing what the site renders. The search button stays exactly as Starlight ships it.
- Testing below the `md` breakpoint, where the rule doesn't fire. The axe tests' viewport doesn't change.
- Running axe on more pages or with more tags. The page list and tags stay as they are, and only move into the spec.

## Decisions

**D1. Make the same bump on this branch, not merge #58.** #58 can't merge as it is, because its `test` fails, and
only Dependabot can push to its branch. The development workflow's route for that is this change: the same bump,
`npm install --save-exact @axe-core/playwright@4.14.0`, then check that `git diff package-lock.json` moves only
`@axe-core/playwright` and `axe-core`. Once this merges, Dependabot closes #58 as up to date.

**D2. Filter accepted findings per node, after axe runs.** axe's own switches are too wide. `.exclude(selector)`
removes the node from every rule, so the button would lose its `button-name`, contrast and focus checks.
`.disableRules([...])` removes the rule from every node, so the site would lose the coverage 4.14 adds. Filtering the
results instead keeps both. A node is dropped from a violation only when the violation's rule id and the node's
joined `target` both match an accepted entry exactly. A violation left with no nodes is dropped. Anything else is
reported as now. Exact matching means a changed selector stops matching and fails loudly (spec, "The node's selector
changes").

**D3. One helper module, `tests/e2e/axe.ts`.** It sits beside `clock.ts` and `port.ts` and exports three things: the
WCAG tags, the `ACCEPTED` list, and a function that runs axe on a page and returns the serious and critical
`rule: targets` strings left after D2. Both spec files call it and keep their own test names, page lists and setup:
`emulateMedia`, the Expressive Code wait in `a11y.spec.ts`, and opening the version menu in `versions.spec.ts`. Each
entry in `ACCEPTED` holds `rule`, `target`, `page` (where it was seen, for D5), and `why`, with the issue link. The
list is typed and closed, and it holds one entry. The filter in D2 is a pure function exported from the same module,
so `tests/unit/e2e-axe.test.ts` can check each case in the spec on hand-made results, the way `e2e-port.test.ts`
checks `port.ts`, without having to break the real site. That unit test also fails when any file under `tests/e2e/`
other than `axe.ts` imports `@axe-core/playwright`, as `e2e-clock.test.ts` does for `clock.install`. So D5's own axe
run lives in the helper too.

**D4. The reason test checks the hint is only a hint.** On `/docs/programme/what-is-troupe/` at the project's desktop
viewport, after the page loads (the inline script has run by then):
- The button's accessible name is exactly "Search" (`toHaveAccessibleName`).
- Its `innerText`, with the outer `<kbd>`'s `innerText` removed and whitespace collapsed, is exactly "Search". Using
  `innerText` counts what a sighted reader sees, including the `aria-hidden` span.
- The outer `<kbd>`'s text, with whitespace collapsed, is `Ctrl K` or `⌘ K`, so other words can't be put into the hint
  and slip past.
- `aria-keyshortcuts` is `Control+K` or `Meta+K`.

Each failure says what it found. The test name says exactly that: the search button's visible text, without its
`Ctrl K`/`⌘ K` hint, is its accessible name "Search", and the hint is exposed as `aria-keyshortcuts`. It doesn't
claim the button meets 2.5.3. Whether speech-input users are served is a judgement Starlight's maintainer made, and
the owner accepted it on 2026-10-29.

**D5. A stale entry fails.** For each `ACCEPTED` entry, a test opens its `page`, runs axe with only its `rule`
(`.withRules([rule])`), and expects a violation whose nodes include its `target`. If none does, it fails, saying the
entry is no longer reported and can be removed. This runs at the same viewport and in light only, since the rule
doesn't depend on colour. The alternative was a comment with a link to check now and then, and nothing would ever
make anyone look.

**D6. Rejected: overriding the button or holding the update.** These were put to the owner on 2026-10-29. Overriding
Starlight's `Search` (dropping `aria-label` and adding a visually hidden fallback, or putting the hint into the
name) means owning a component the project's constraints say not to fork. Per #4260 it either still fails because of
axe-core#5458 or makes screen readers read the shortcut twice. Holding at 4.13 gives up the rule's coverage of every
other control. The owner chose the narrow exception.

## Risks / Trade-offs

- [The fixture build's axe tests, which #58's run never reached, find something besides the search button.] → The
  full `uv run scripts/check.py` runs both builds locally before the pull request. Anything new is reported to the
  owner, not added to `ACCEPTED`. The list grows only by a decision.
- [axe changes how it writes the selector, for example dropping `=""`.] → The entry stops matching, so the axe tests
  fail and D5 fails too. That's loud, and the fix is a one-line entry update that a reviewer can see.
- [A Starlight update changes the button.] → D4 or D5 fails, naming what changed. That's the point. The update then
  has to decide again, rather than inherit an exception granted for different markup.
- [The test sees `⌘` on macOS and `Ctrl` on Linux.] → D4 accepts both, and both platforms run it: the maintainer's
  machine locally, and CI.
- [Accepting the finding is a judgement on an open WCAG question.] → It's recorded where it's applied (`why`, linking
  #4260) and in this spec. D5 brings it back up as soon as either upstream changes.

## Migration Plan

1. Land by the merge queue as usual. Nothing is deployed differently, because no page changes.
2. After the merge, check #67 is closed, its card says Done, and #58 has been closed by Dependabot as up to date.
   If #58 is still open a day later, close it with a comment that links the merged pull request.
3. Rollback: revert the commit. The lockfile returns to 4.13.0, where the rule is experimental and doesn't run.
