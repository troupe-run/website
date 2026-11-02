# Tasks

## 1. Say the review resolves a nit a push has fixed

- [x] 1.1 In CLAUDE.md's step 5, after "The review resolves its own must-fixes once they're addressed", add that it
  resolves its own nits once a push has fixed them, so a nit fixed by a push needs no reply or resolve, in the words of
  infrastructure's `CLAUDE.md` step 5. Keep "resolve only nits" and the rest of the step as they are. Verify by reading
  the step against infrastructure's step 5 and against the "An agent finishes a pull request" scenario of this change's
  `contributing` delta, and that `grep -n "resolve only nits" CLAUDE.md` still finds it.
- [x] 1.2 In `openspec/config.yaml`'s context, in the "Before archiving" bullet, add after the must-fixes sentence that
  the review also resolves its own nits once a push has fixed them, so a nit fixed by a push needn't be resolved by
  hand, in the words of infrastructure's `openspec/config.yaml`. Keep "resolve only nits". Verify by reading the bullet
  against infrastructure's and against both scenarios of "Every proposed change plans acting on Claude's review", and
  that `openspec instructions proposal --change review-resolves-nits-docs --json` shows the new sentence in its
  `context` (the YAML still parses and the context is what a proposal is given).
- [x] 1.3 Verify `openspec validate review-resolves-nits-docs --strict` and `uv run scripts/check.py` pass before the
  commit.

## 2. Say the rest of what infrastructure says about Claude's review (#101)

- [x] 2.1 In CLAUDE.md's step 5, in the words of infrastructure's `CLAUDE.md` step 5: say a must-fix fixed by a push
  gets no "fixed" reply, and to reply only when it needs a discussion, and then before pushing; replace "for a must-fix
  answered without a push, re-run the last `claude review` run" with the review judging a reply to a must-fix when it's
  posted, re-run (`gh run rerun <id>`) only if that run fails; and say the pull request is marked ready only once the
  review of the last push has completed (the required `claude review completed` check passed; if it failed, re-run the
  run it names). Leave out infrastructure's "CI posts its plan". Verify by reading the step against infrastructure's
  step 5 and against the "An agent finishes a pull request" scenario's AND lines, and that
  `grep -n "re-run the last" CLAUDE.md` finds nothing.
- [x] 2.2 In CLAUDE.md's step 6, name `claude review completed` beside `test` and `guard (workflow rules)` as what the
  merge queue waits for on the queued commit. Verify against `gh api repos/troupe-run/website/rules/branches/main`'s
  required checks and the "An agent merges a pull request" scenario.
- [x] 2.3 In `openspec/config.yaml`'s "Before archiving" bullet: say the review judges a reply to a must-fix when it's
  posted, re-run only if that run fails, in the words of infrastructure's `openspec/config.yaml`, replacing "after
  answering a must-fix without a push, re-run the last `claude review` run"; and add, in the words of infrastructure's
  `CLAUDE.md`, that a must-fix fixed by a push gets no "fixed" reply (a reply needing a discussion goes before the
  push) and that the pull request is marked ready only once the review of the last push has completed. Keep the nits
  sentence and "resolve only nits". Verify against each scenario of "The context says how the review takes replies and
  readiness", and that `openspec instructions proposal --change review-resolves-nits-docs --json` shows the bullet in
  its `context`.
- [x] 2.4 Verify `openspec validate review-resolves-nits-docs --strict` and `uv run scripts/check.py` pass before the
  commit.

## Workflow follow-up

- The pull request (#100) closes both #89 and #101. Act on Claude's review of the last push, and mark it ready once
  that review has completed and is clean.
- Archive the change on the branch, then ask the owner to merge.
- After the merge, check #89 and #101 are closed and their cards on the troupe roadmap say Done, and comment on each
  with the pull request and the archived change.
