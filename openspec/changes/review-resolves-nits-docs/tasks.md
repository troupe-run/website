# Tasks

## 1. Say the review resolves a nit a push has fixed

- [ ] 1.1 In CLAUDE.md's step 5, after "The review resolves its own must-fixes once they're addressed", add that it
  resolves its own nits once a push has fixed them, so a nit fixed by a push needs no reply or resolve, in the words of
  infrastructure's `CLAUDE.md` step 5. Keep "resolve only nits" and the rest of the step as they are. Verify by reading
  the step against infrastructure's step 5 and against the "An agent finishes a pull request" scenario of this change's
  `contributing` delta, and that `grep -n "resolve only nits" CLAUDE.md` still finds it.
- [ ] 1.2 In `openspec/config.yaml`'s context, in the "Before archiving" bullet, add after the must-fixes sentence that
  the review also resolves its own nits once a push has fixed them, so a nit fixed by a push needn't be resolved by
  hand, in the words of infrastructure's `openspec/config.yaml`. Keep "resolve only nits". Verify by reading the bullet
  against infrastructure's and against both scenarios of "Every proposed change plans acting on Claude's review", and
  that `openspec instructions proposal --change review-resolves-nits-docs --json` shows the new sentence in its
  `context` (the YAML still parses and the context is what a proposal is given).
- [ ] 1.3 Verify `openspec validate review-resolves-nits-docs --strict` and `uv run scripts/check.py` pass before the
  commit.

## Workflow follow-up

- Open the pull request as a draft (`Closes #89`), act on Claude's review, and mark it ready once it's clean.
- Archive the change on the branch, then ask the owner to merge.
- After the merge, check #89 is closed and its card on the troupe roadmap says Done, and comment on it with the pull
  request and the archived change.
