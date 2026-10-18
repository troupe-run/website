# Tasks

## 1. Install OpenSpec 1.14.3

- [ ] 1.1 Upgrade the CLI through Homebrew, which is how it's installed on the development machine (the owner is
  doing this). Verify: `openspec --version` prints `1.14.3`.

## 2. Regenerate the skills and commands

- [ ] 2.1 Run `openspec update` from the project root. Verify: `git status --short` lists exactly the eight expected
  files (the six `.claude/skills/openspec-*/SKILL.md` and `.claude/commands/opsx/{propose,explore}.md`) and no others.
- [ ] 2.2 Check the regenerated files say 1.14.3. Verify: `grep -rh generatedBy .claude/skills` prints only
  `generatedBy: "1.14.3"`, six times.
- [ ] 2.3 Review the diff. Verify: apart from the version lines, the only change is the output-path check for glob
  artifacts in propose and explore (skill and command), as in the 1.14.3 release notes. Record anything else found in
  the pull request.

## 3. Verify

- [ ] 3.1 Run `openspec validate --all`. Verify: it exits 0 and doesn't hang.
- [ ] 3.2 Run `uv run scripts/check.py`. Verify: it passes.

## Workflow follow-up

- Open a pull request that closes troupe-run/website#16, with CI's `test` job passing.
- Archive the change on its branch with `/opsx:archive`, then merge by rebase.
- After the merge, comment on #16 with the pull request and the archived change, and check that the roadmap card
  says Done.
