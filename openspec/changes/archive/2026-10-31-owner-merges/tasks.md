# Tasks

## 1. CLAUDE.md's merge step

- [x] 1.1 Rewrite CLAUDE.md's step 6: `/opsx:archive` runs on the branch before merging; once `test` has passed and
  every conversation is resolved, the agent asks the owner to merge; the owner adds the pull request to the merge
  queue, which lands it by rebase once `test` and `guard (workflow rules)` pass on the queued commit; and
  `gh pr merge <n> --rebase --admin`, which skips the queue, is the owner's route for emergencies such as clearing a
  stuck queue. Verify by reading the new step against infrastructure's CLAUDE.md ("The owner merges by rebase, through
  the merge queue") and the `owner-only` rule in infrastructure's `docs/development-workflow.md`, and against each
  scenario of this change's `contributing` delta, and that `grep -n "gh pr merge" CLAUDE.md` finds it only in a
  sentence that names the owner.
- [x] 1.2 Verify `openspec validate owner-merges --strict` and `uv run scripts/check.py` pass before the commit.

## Workflow follow-up

- Open the pull request as a draft (`Closes #79`), act on Claude's review, and mark it ready once it's clean.
- Archive the change on the branch, then ask the owner to merge, as the new step 6 says.
- After the merge, check #79 is closed and its card on the troupe roadmap says Done, and comment on it with the pull
  request and the archived change.
