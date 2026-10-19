# Tasks

## 1. Baseline

- [x] 1.1 Before touching anything, run `npm ci && npm run build && npm run linkcheck:external` on this branch and save
  its stdout and exit code to the scratchpad. This is the "no `extra-url`" behaviour, which must not change. Verify:
  the file is saved, and it holds the external link count and exit code.

## 2. The issue body loses its hand-add line (D6)

- [x] 2.1 Turn the test around first. Rename `adds how the issue closes and the roadmap-board note only for the issue`
  to `adds how the issue closes, and no hand-add note, only for the issue`. Check that the closing note is there and
  that the text doesn't mention adding it to the board by hand. Verify: `npm run test:unit` fails on that test, and
  only that one.
- [x] 2.2 Remove the line from `formatReport`, and update its doc comment, which mentions "the note about the roadmap
  board". Verify: `npm run test:unit` passes.
- [x] 2.3 Commit ("drop the hand-add line: the weekly check puts its issue on the board itself").

## 3. `links` hands over the issue's URL (D3)

- [x] 3.1 Add `boardIssueUrl({ decision, openedUrl })` to `scripts/linkcheck-external-lib.mjs`, test first. Cases:
  `open` gives `openedUrl`; `comment` gives `decision.issue.url`; `close` and `none` give `''`; `open` with an empty
  `openedUrl` gives `''`. Verify: the tests fail before the function exists and pass after.
- [x] 3.2 In `scripts/linkcheck-external.mjs`, add `url` to the `gh issue list --json` fields. Keep the trimmed URL
  that `gh issue create` prints. After the issue step, when `GITHUB_OUTPUT` is set and `boardIssueUrl` isn't empty,
  append `issue-url=<url>`. A failure there sets `reportFailed`. Add `url` to the `Issue` typedef. Verify: `npm run
  test:unit` passes. A local run with `GITHUB_ACTIONS` unset gives the same stdout and exit code as the 1.1 baseline.
- [x] 3.3 Commit ("hand the tracking issue's URL to the next job").

## 4. `extra-url` (D5)

- [x] 4.1 Add `extraUrlProblem(value, skips)` to the lib, test first. It returns `null` for `''`, `undefined`, and
  `https://troupe.run/definitely-not-here-404`. It returns a message naming `extra-url` and the value for
  `troupe.run/x`, `ftp://troupe.run/x`, `/docs/` and `not a url`. For a URL a skip matches, the message names the
  skip's pattern. Test that last case with a skip list passed in, not `EXTERNAL_SKIPS`, which is empty. Verify: the
  tests fail before the function exists and pass after.
- [x] 4.2 Add the extra page's writer and remover to the lib, as a pure function that returns the page's HTML. Test
  first that the HTML holds exactly one `<a href>` and that `"`, `&`, `<` and `>` in the URL are escaped. Then wire it
  in `linkcheck-external.mjs`: read `EXTRA_URL`, refuse with `extraUrlProblem` (exit 1 before linkinator, no issue
  touched), write `<dir>/extra-url-input/index.html`, and remove it in a `finally`. Verify: `npm run test:unit` passes.
  Then run these locally:
  - `EXTRA_URL=https://troupe.run/definitely-not-here-404 npm run linkcheck:external` exits 1, lists that URL with 404
    on `/extra-url-input`, and leaves no `dist/extra-url-input` behind.
  - `EXTRA_URL=troupe.run/x npm run linkcheck:external` exits 1 with the `extra-url` message and checks no links.
  - With `EXTRA_URL` unset, the stdout and exit code match the 1.1 baseline.
- [x] 4.3 Update the header comments in `linkcheck-external.mjs` and `links-weekly.yml` to mention `extra-url` and the
  board job. Verify: they describe what the code does, read side by side with it.
- [x] 4.4 Commit ("let a run started by hand check one extra URL, to prove the issue path on main").

## 5. The `board` job (D1, D2, D3, D4)

- [ ] 5.1 Write `tests/unit/links-weekly-board.test.ts` first, parsing `.github/workflows/links-weekly.yml` with
  `yaml`, as `workflow-node-version.test.ts` does. Give it one test per D7 check, each named for exactly what it
  checks. For example: "the board job needs links and runs only when links handed over an issue URL and the run
  wasn't cancelled", "only the board job uses an environment or mentions BOARD_APP_PRIVATE_KEY", and "the board job
  has no checkout, setup or npm step and an empty permissions map". Verify: the new tests fail against the current
  workflow.
- [ ] 5.2 Change `links-weekly.yml`. The workflow level becomes `permissions: {}`. `links` gets `permissions:
  contents: read, issues: write`, its check step gets an `id` and `EXTRA_URL: ${{ inputs.extra-url }}` in `env`, and
  the job gets `outputs.issue-url`. `workflow_dispatch` gets the optional `extra-url` input, with a description that
  says it's for proving the issue path. Add the `board` job as in D1 to D4. Its run step checks `ISSUE_URL` against
  `^https://github\.com/troupe-run/website/issues/[0-9]+$` and fails naming the value. Then it runs `gh project
  item-add 1 --owner troupe-run --url "$ISSUE_URL"`. Verify: `npm run test:unit` passes, and the 5.1 tests now pass.
- [ ] 5.3 Test the shape check by itself. Run the board step's shell snippet locally with
  `ISSUE_URL=https://github.com/troupe-run/website/issues/18`, with `https://github.com/troupe-run/troupe/issues/1`, and
  with `https://github.com/troupe-run/website/issues/1;echo` (replace `gh` with `echo` for this). Verify: the first
  reaches the `gh` line, and the other two fail naming the value.
- [ ] 5.4 `uv run scripts/check.py` passes. Commit ("put the weekly check's issue on the roadmap board from a job that
  runs no site code").

## 6. Branch run (integration)

- [ ] 6.1 Tell the owner this opens a real issue, then go ahead. Push the branch and run `gh workflow run
  links-weekly.yml --ref add-link-issue-to-board -f extra-url=https://troupe.run/definitely-not-here-404`. Verify, from
  the run and `gh issue view <n> --json projectItems`: `links` opened the tracking issue and its output holds the
  issue's URL; `board` was refused the `board` environment (the branch policy, which infrastructure didn't probe);
  the run is failed; and the issue isn't on the board.
- [ ] 6.2 Run it again on the branch with `extra-url` empty. Verify: the run is green and the issue is closed with a
  link to the run. Then add that issue to the board, set it to Done, and comment that it was this change's branch
  test. Check it with `gh issue view <n> --json projectItems`.
- [ ] 6.3 Open the pull request (`Closes #18`, body via `--body-file`). Verify: CI's `test` job passes.

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- After the merge, prove it on `main` (design, Migration Plan step 3). Run `gh workflow run links-weekly.yml --ref main
  -f extra-url=https://troupe.run/definitely-not-here-404` and check that a new issue is opened and on the board. Run it
  again with the same input and check there's a comment and still one card. Run it with `extra-url` empty and check the
  issue is closed. Then check its card says Done, and set it if it doesn't. If GitHub didn't move it, say so on #18
  and suggest a follow-up issue.
- Comment on #18 with the pull request, the archived change and the three `main` run links, and close it. Check that
  #18's card says Done.
