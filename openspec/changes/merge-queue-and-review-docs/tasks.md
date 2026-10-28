# Tasks

## 1. CLAUDE.md

- [x] 1.1 In "How work happens here", add step 5 "Claude's review is acted on" and renumber the archive and
      after-merge steps to 6 and 7, as design D1 words it, linking development-workflow.md's "Claude's review".
      Verify by reading CLAUDE.md against the scenario "An agent finishes a pull request".
- [x] 1.2 Rewrite the archive step's merge sentence: added to the merge queue (`gh pr merge <n>` or **Merge when
      ready**), landed by rebase once `test` and `guard (workflow rules)` pass on the queued commit, and
      `gh pr merge <n> --rebase --admin` only for emergencies such as a stuck queue. Verify by reading CLAUDE.md
      against the scenarios "An agent merges a pull request" and "An agent starts a session", and that README.md
      still doesn't restate the steps.

## 2. openspec/config.yaml

- [x] 2.1 Add infrastructure's review line at the end of the `context`'s **Working** list, as design D2 says. Verify
      `python3 -c "import yaml;yaml.safe_load(open('openspec/config.yaml'))"` (or `uv run`) parses it and
      `openspec validate merge-queue-and-review-docs` passes.
- [x] 2.2 Verify the line reaches a proposal: `openspec instructions tasks --change merge-queue-and-review-docs --json`
      prints a `context` containing "wait for Claude's review of the last push".

## 3. Check and pull request

- [ ] 3.1 `uv run scripts/check.py` passes, and the owner has the CLAUDE.md and config.yaml diff to review as text.
- [ ] 3.2 Open the pull request with `Closes #71` and `Closes #72`; CI's `test` and `guard (workflow rules)` pass.
- [ ] 3.3 Wait for Claude's review of the last push and act on each finding by its tier: fix or answer every
      must-fix and nit, resolve only nits, and raise decisions and disputed must-fixes with the owner. Verify no
      conversation is left unresolved except those waiting on the owner.

## Workflow follow-up

- `/opsx:archive` on the branch, pushed, then the pull request is added to the merge queue (`gh pr merge <n>`).
- After the merge: check #71 and #72 are closed and their cards on the troupe roadmap say Done; comment on each with
  the pull request and the archived change; comment on troupe-run/infrastructure#194 with the pull request (#72's
  "Done when").
