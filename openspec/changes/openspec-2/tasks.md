# Tasks

## 1. Regenerate the OpenSpec files

- [x] 1.1 Verify `openspec --version` prints `2.0.0` (design D1). Run `openspec update --dry-run`, keep its list of 25
  changes, and verify it lists no locally edited file to keep.
- [x] 1.2 Run `openspec update` from the repository root. Verify `git status --short` matches the dry run's list
  exactly: `.agents/skills/.openspec-target` and six `.agents/skills/openspec-*/SKILL.md` added, six
  `.claude/commands/opsx/*.md` deleted, six `.claude/skills/openspec-*` now relative links into `.agents/skills/`.
  Verify `openspec/config.yaml` and `.claude/settings.json` are unchanged. Revert and report any other file.
- [x] 1.3 Verify each `.agents/skills/openspec-*/SKILL.md` says `generatedBy: "2.0.0"`, then run `openspec update`
  a second time and verify nothing changes.

## 2. Replace the `/opsx:*` names

- [x] 2.1 In `CLAUDE.md`, replace `/opsx:propose`, `/opsx:apply` and `/opsx:archive` with `/openspec-propose`,
  `/openspec-apply-change` and `/openspec-archive-change`, keeping lines within 120 columns.
- [x] 2.2 Verify `git grep -n '/opsx:' -- ':!openspec/changes' ':!docs/superpowers' ':!scripts/guard.py'
  ':!.github/workflows/guard.yml' ':!openspec/specs/contributing/spec.md'` finds nothing (the spec changes at
  archive, from this change's delta).
- [x] 2.3 Run `openspec validate --all --strict` with 2.0.0 and with 1.14.3
  (`npx -y @fission-ai/openspec@1.14.3 validate --all --strict`, the version CI still pins), and verify both pass.

## 3. Verify and commit

- [x] 3.1 Run `uv run scripts/check.py` (load under ~40) and verify it passes. Commit as
  `chore(openspec): upgrade to OpenSpec 2.0.0`.

## Workflow follow-up

- Open a draft pull request that says `Closes #116`, mentions troupe-run/infrastructure#308 without a closing keyword,
  and act on Claude's review.
- Archive the change on the branch before merging (syncs the `contributing` delta).
- After the merge, check #116 is closed and its card says Done.
