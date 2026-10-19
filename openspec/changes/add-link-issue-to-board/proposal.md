# Proposal

## Why

The weekly external link check opens or updates the "Broken external links" issue with `GITHUB_TOKEN`, which can't
write an org project. So the issue lands off the troupe roadmap board, and its body asks whoever triages it to add it
by hand (#18, troupe-run/infrastructure#59). infrastructure has now declared a credential that can do it
(troupe-run/infrastructure#93, change `add-link-issue-to-board`, spec `board-credentials`). That's the App
`troupe-run-board`, the main-only environment `board` on this repository holding `BOARD_APP_PRIVATE_KEY`, and the
variable `BOARD_APP_CLIENT_ID`. All three exist on GitHub today, checked by name on 2026-10-19.

## What Changes

- `.github/workflows/links-weekly.yml` gains a second job, `board`. It runs after `links` only when `links` opened or
  commented on the tracking issue, and it runs even though `links` failed, as it does whenever it finds a broken link.
  It uses `environment: board`, mints a token for the board App, and adds the issue to project 1 with
  `gh project item-add`. It checks out nothing, installs nothing, and its `GITHUB_TOKEN` has no permissions.
- `links` hands over the issue's URL as a job output. It's set only when the run opened or commented on the issue.
  `links` never reads the key, so the site's dependencies (`npm ci`, the build) never run where the key is readable.
- The issue body loses its line "Whoever triages this adds it to the troupe roadmap board by hand".
- A run started by hand takes an optional input, `extra-url`. It's one more external URL to check, as if a page on the
  site linked to it. It's how this change is proved on `main` without breaking the site: `main` has no broken link, and
  the `board` environment refuses every other branch (owner, 2026-10-19). A scheduled run has no inputs, so it checks
  only the site. An `extra-url` that isn't an absolute http(s) URL, or that a skip pattern would skip, fails the run
  and names the input. It isn't ignored.
- After the merge, the change is proved on `main`. A run started by hand with a URL that's certain to 404 opens the
  issue and puts it on the board. A second, clean run closes it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `link-checking`: the tracking issue is added to the roadmap board when it's opened or updated, by a job that's
  separate from the build and holds the only credential that can write the board. A run started by hand can check one
  extra URL. The issue body no longer asks for a hand add.

## Impact

- Code: `.github/workflows/links-weekly.yml`, `scripts/linkcheck-external.mjs`, `scripts/linkcheck-external-lib.mjs`.
- Tests: `tests/unit/linkcheck-external.test.ts`, and a new structural test of the workflow, written the same way as
  `tests/unit/workflow-node-version.test.ts`.
- A new action, `actions/create-github-app-token@v3`. It's first-party, so it's pinned to a major tag like the
  repository's other `actions/*` steps.
- GitHub: a deployment to the `board` environment on each run that writes the board. Nothing in this repository's
  settings changes. They're declared in troupe-run/infrastructure, and this change needs nothing new from it.
- Proving it creates one real "Broken external links" issue on `main`, which the second run closes. That's what #10
  was for the earlier change.
- Rollback: revert the commit. The issue then goes back to landing off the board, with no hand-add line, so the revert
  also restores that line.
