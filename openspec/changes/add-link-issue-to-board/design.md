# Design

## Context

- `links-weekly.yml` has one job, `links`, with workflow-level `contents: read` and `issues: write`. It checks out,
  runs `npm ci` and the build, then `npm run linkcheck:external` with `GH_TOKEN: ${{ github.token }}`. It fails
  whenever it finds a broken link.
- `scripts/linkcheck-external.mjs` runs linkinator and `gh`. Its decisions are pure functions in
  `scripts/linkcheck-external-lib.mjs` (`decide`, `formatReport`, `matchTrackingIssues`, `exitCode`), and
  `tests/unit/linkcheck-external.test.ts` tests them. `gh issue create` prints the new issue's URL. The open-issue
  lookup asks for `number,title,author,createdAt,state`, which doesn't include `url`.
- `formatReport({ forIssue: true })` ends with the hand-add line. The test `adds how the issue closes and the
  roadmap-board note only for the issue` checks that it's there.
- `tests/unit/workflow-node-version.test.ts` already parses the workflows with `yaml` and checks their structure. A
  test of the board job's shape can be written the same way.
- infrastructure's design for the credential (troupe-run/infrastructure, archived `add-link-issue-to-board`, D5 and
  D6) outlines this job, and probed the App. An installation token with only organisation "Projects: read and write"
  adds an issue from this public repository by URL. `gh project item-add` accepts a `ghs_…` token. A write to this
  repository is refused with 403. It didn't probe the `board` environment's branch policy. It inferred it from
  `release` and `github-pages`, which are declared the same way.
- `actions/create-github-app-token@v3` (v3.3.0) takes `client-id`, `private-key` and `owner`, plus
  `permission-<name>` inputs that narrow the token. `permission-organization-projects` is one of them. By default it
  revokes the token when the job ends.
- `EXTERNAL_SKIPS` is empty today. It can gain entries, so the extra-URL check has to read it.

## Goals / Non-Goals

**Goals:**

- The key is readable only in a job that runs no code from this repository or npm, and only on `main`.
- The board job doesn't trust what `links` hands it beyond the one shape it expects. `links` runs third-party code.
- Every decision this change adds (which URL to hand over, whether `extra-url` is valid) is a pure function with a
  unit test. The workflow's shape has a structural test.

**Non-Goals:**

- Setting the card's Status, for example to Done when a clean run closes the issue. The board has GitHub's own
  "item closed" workflow, but the org's rule is to check rather than assume it. Covered in Risks.
- Opening the issue with the App instead of `GITHUB_TOKEN` (infrastructure D1 ruled that out).
- Any other automated issue, or any other repository.
- Two runs at once racing to open the issue. That's already possible today, and this change doesn't make it worse.

## Decisions

### D1. The board write is a job of its own, `board`

`board` runs on `needs: links`. It has `environment: board` and `permissions: {}`. Its steps are exactly the token step
and one `run:` step that calls `gh`. There's no checkout, so nothing from the repository is on disk, and no
`setup-node` or `npm`. `links` keeps `contents: read` and `issues: write`, moved from the workflow level to the job, and
the workflow level becomes `permissions: {}`. That way a third job added later starts with nothing.

Alternative: one job, with the key in a later step. The key would then be readable, through the environment, in the
same job as `npm ci` and the build, where any dependency's install script runs. Rejected, as infrastructure D5
already said.

### D2. `board` runs when `links` handed over a URL, even though `links` failed

The condition is `if: ${{ !cancelled() && needs.links.outputs.issue-url != '' }}`. The run usually fails *because* it
found broken links, so the default `success()` would never run the job. #18 suggests `always()`. `!cancelled()`
behaves the same except when someone cancels the run, and a cancelled run should write nothing more.

### D3. `links` hands over the issue's URL, and the board job checks its shape

- `linkcheck-external.mjs` writes `issue-url=<url>` to `$GITHUB_OUTPUT` after it opens or comments on the issue, and
  only then. The open-issue lookup adds `url` to its `--json` fields. A new pure function,
  `boardIssueUrl({ decision, openedUrl })`, picks the URL. For `open` that's the URL `gh issue create` printed, for
  `comment` it's the matched issue's `url`, and for everything else it's empty. The step gets an `id`, and the job maps
  `outputs.issue-url` from it.
- If the issue was opened but writing the output fails, the run is already failing (`reportFailed`), and the issue
  stays off the board. That's today's behaviour, so nothing is lost.
- **The board job doesn't trust the value.** A compromised dependency in `links` could set any output. Before calling
  `gh`, the run step checks the value against `^https://github\.com/troupe-run/website/issues/[0-9]+$`. If it doesn't
  match, the step fails, naming the value, and the board isn't touched. The value reaches the shell through `env:`,
  never through `${{ }}` inside `run:`, so it can't inject a command.

The URL is used rather than the issue number, because `gh project item-add` takes `--url` and the URL says which
repository the issue is in.

### D4. The token asks for only the projects permission

```yaml
- uses: actions/create-github-app-token@v3
  id: token
  with:
    client-id: ${{ vars.BOARD_APP_CLIENT_ID }}
    private-key: ${{ secrets.BOARD_APP_PRIVATE_KEY }}
    owner: troupe-run
    permission-organization-projects: write
```

The App has exactly that permission already (spec: board-credentials). Asking for it by name means the token
can't grow if the App ever gains a permission by hand before the drift check catches it. `repositories` is left
unset, which gives the installation's own selection. That's none, and it's what the probe minted. The token is
revoked when the job ends (the action's default). `@v3` is a major tag, like the repository's other `actions/*`
steps. Third-party actions are pinned to a commit, and this one isn't third-party.

Then:

```yaml
- env:
    GH_TOKEN: ${{ steps.token.outputs.token }}
    ISSUE_URL: ${{ needs.links.outputs.issue-url }}
  run: <shape check from D3>; gh project item-add 1 --owner troupe-run --url "$ISSUE_URL"
```

`gh` is preinstalled on GitHub's Ubuntu runners. `project item-add` needs no repository checkout when `--owner` and
`--url` are given.

### D5. `extra-url` is checked as a link on a page added to the scan

The workflow declares `workflow_dispatch.inputs.extra-url` (string, optional, default empty), and passes it to the
check as `EXTRA_URL` through `env:`. When it's set, `linkcheck-external.mjs` writes one page, `<dir>/extra-url-input/index.html`,
containing a single link to it, runs linkinator as now, and removes the page afterwards (in a `finally`, so a local run
leaves `dist` as it found it). The URL then goes through the same retries, skips, counting, report and issue as every
other link, and the "Found on" column shows `/extra-url-input/`, which says where it came from.

The page is written only into the scan directory of a workflow that never deploys. `deploy.yml` builds its own `dist`.

A new pure function, `extraUrlProblem(value, skips)`, returns `null` for an empty value or an absolute `http:` or
`https:` URL (parsed with `new URL`) that no skip pattern matches. Otherwise it returns a message naming `extra-url`,
the value and the fix, or naming the skip pattern it matched. The script prints the message and exits 1 before running
linkinator, and touches no issue. The value is HTML-escaped when it's written into the page.

Alternatives:
- A second linkinator call on the URL. With `--recurse` it would crawl a live site from a working URL. Without it, it
  would still check every link on that page. Either way the result would need merging into the first. Rejected.
- `fetch` the URL directly. That needs its own retries, status handling and report row, which would be a second check
  to keep in step with the first. Rejected.

### D6. The hand-add line goes, and its test is turned around

`formatReport` drops the line. The existing test becomes `adds how the issue closes, and no hand-add note, only for
the issue`. It checks that the closing note is there and that `by hand` about the board isn't, so the name says what
the body checks.

### D7. How it's proved

Unit tests cover `boardIssueUrl`, `extraUrlProblem`, and the page written for `extra-url` (escaping, and removing it).
A structural test (`tests/unit/links-weekly-board.test.ts`) parses the workflow and checks these things:
- `board` needs `links`, has the D2 condition, uses `environment: board`, has `permissions: {}`, and has no
  `actions/checkout`, `setup-*` or `npm` step.
- No other job has an environment, and no other job mentions `BOARD_APP_PRIVATE_KEY`.
- `links` maps `outputs.issue-url` from its check step's output.
- `ISSUE_URL` and `EXTRA_URL` reach their `run:` steps through `env:`, and no `run:` mentions `inputs.` or `needs.`.
- Only `workflow_dispatch` declares `extra-url`, and `schedule` stays.

What the structural test can't prove (that GitHub grants the environment on `main` only, that the token works, that
the card appears) is proved by real runs, in Migration Plan. Whoever runs them reads the result with
`gh issue view --json projectItems`.

## Risks / Trade-offs

- [`extra-url` is a test hook in a production check] → Only a run started by hand can set it, which takes write access
  to this repository. The worst it can do is open or comment on the tracking issue with a URL the maintainer chose,
  which a clean run then closes. Scheduled runs have no inputs.
- [A compromised dependency in `links` sets `issue-url` to another issue] → D3's shape check limits it to an issue in
  this repository. Adding one of this repository's public issues to the board is all it could do, and that's
  recoverable.
- [The key is rotated, or the secret is missing] → The token step fails and the run is red (spec: a failed board write
  is visible). The issue is still opened or commented on. The next failing run re-adds it.
- [The card for a closed tracking issue doesn't say Done] → Closing is done by the bot. If GitHub's "item closed"
  project workflow doesn't move the card, a sweep finds a closed issue that isn't Done. The proof runs check this
  once, and tasks say what to do if it doesn't move. If it needs automating, that's a follow-up issue, not this change.
- [The board job adds a deployment to `board` on every failing week] → That's how environments work. It's one record a
  week, and it shows when the key was used.

## Migration Plan

Each run below creates or changes a real issue in this repository. Tell the owner before the first one.

1. **On the branch, before the pull request.** Start the workflow by hand on the branch with
   `extra-url=https://troupe.run/definitely-not-here-404`. Expected: `links` opens the tracking issue and hands over
   its URL, and `board` is refused the `board` environment, so the run fails and the issue isn't on the board. This is
   the branch-policy check that infrastructure didn't probe. Then a clean branch run closes the issue. Add that test
   issue to the board, set it to Done, and comment that it was this change's branch test.
2. **Merge.** Merging is the deploy. The next Monday run uses it.
3. **On `main`.** Start it by hand with the same `extra-url`. Expected: a new tracking issue is opened, and the same run
   adds it to the board. Start it again with the same input. Expected: a comment, and the board still has one card for
   it. Start it once more with `extra-url` empty. Expected: the issue is closed. Then check the card says Done, and set
   it if it doesn't (Risks).
4. Comment on #18 with the pull request, the archived change and the three run links, and close it.

Rollback: revert the commit. The issue then lands off the board again, and the hand-add line comes back with the
revert.
