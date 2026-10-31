# troupe.run

This repository is the troupe.run website: the landing page, the docs at /docs and the blog. troupe itself lives in
troupe-run/troupe, and so does the text of /docs (`docs/` there), which every build fetches and renders one version per
release. Change a docs page in troupe, never in `src/content/docs/docs/`, which is generated. The same goes for the
schemas at /protocol/: they come from troupe's `protocol/schemas/`, one copy per protocol release, and
`public/protocol/` is generated. See [openspec/config.yaml](openspec/config.yaml) for the constraints every change
respects, [README.md](README.md) for setting up and running the site, and the org's
[contributing guide](https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md), which applies here as in every
troupe-run repository.

## How work happens here

Every change, however small, follows one path.

1. **An issue** says what and why.
2. **An OpenSpec change** says how: `/opsx:propose <name>`, on a branch named exactly `<name>`. Its proposal cites
   the issue. Design decisions are surfaced in the proposal or design before code depends on them.
3. **`/opsx:apply`** builds it. A task is ticked only when its verification has run and passed.
4. **A draft pull request** closes the issue (`Closes #n`): `gh pr create --draft`. Claude reviews it; CI's `test`
   waits until it's marked ready.
5. **Claude's review is acted on**, after the review of the last push: fix or answer each finding, resolve only nits,
   and raise decisions and disputed must-fixes with the owner. The review resolves its own must-fixes once they're
   addressed; for a must-fix answered without a push, re-run the last `claude review` run (`gh run rerun <id>`). Once
   the review of the last push leaves no must-fix or decision open, **mark it ready** (`gh pr ready <n>`): CI's `test`
   runs and passes. A merge needs every conversation resolved
   ([development-workflow.md, "Claude's review"](https://github.com/troupe-run/infrastructure/blob/main/docs/development-workflow.md#claudes-review)).
6. **`/opsx:archive`** runs on the branch before merging, so the pull request lands code, tests and specs together.
   Once `test` has passed and every conversation is resolved, **ask the owner to merge**. The owner merges by rebase,
   through the merge queue (`gh pr merge <n>`, or **Merge when ready**), which lands it once `test` and
   `guard (workflow rules)` pass on the queued commit. Merging, queueing and auto-merge are the owner's: the guard
   refuses them from an agent as `owner-only`. The owner's `gh pr merge <n> --rebase --admin` skips the queue; it's
   for emergencies, such as clearing a stuck queue.
7. **After the merge**, comment on the issue with the pull request and the archived change.

Commits are Conventional Commits (`feat(docs): ...`), with **no sign-off**: this repository takes no DCO and no
CLA. `uv run scripts/check.py` passes before each commit; it's the same check CI runs.

## Guardrails

Git hooks and Claude Code hooks enforce the path above. They're delivered from troupe-run/infrastructure, and
[development-workflow.md](https://github.com/troupe-run/infrastructure/blob/main/docs/development-workflow.md) lists
every rule. Their files (`scripts/guard.py`, `scripts/guard_pytest.py`, `.githooks/`, `.claude/settings.json`,
`.github/workflows/guard.yml`, `.github/guard-delivery.json`) are changed there, never here. When a guardrail refuses
an action:

- **Follow its fix.** Don't look for another route to the same action. The hooks aren't a security boundary, so
  getting round one is possible, and it's exactly the shortcut they exist to stop.
- **If the rule seems wrong for the situation, stop and ask the owner.** Only a person, in their own terminal, can
  grant an override, and every use is logged.

This repository's GitHub settings (rulesets, required checks, labels, Pages) and troupe.run's DNS are declared in
troupe-run/infrastructure too. Change them there, by an issue in that repository.
