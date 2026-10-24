# Tasks

## 1. Tests that state the rule, first

- [ ] 1.1 In `scripts/tests/test_check.py`, move the gate-source list and the matching into functions that take a
  root (design D3), still listing with `rglob`, and verify `python -m unittest discover -s scripts/tests` gives the
  same result as before on a fresh checkout (no `src/content/docs/docs/`)
- [ ] 1.2 Add tests on a throwaway `git init` repository whose `.gitignore` lists `src/content/docs/docs/`: a tracked
  `src/` file naming `CLAUDE.md` is reported, a new untracked one is reported, and an ignored page under
  `src/content/docs/docs/` naming it isn't. Verify the first two pass and the third fails on the `rglob` listing, so
  the tests can tell the old behaviour from the new

## 2. List gate sources from git

- [ ] 2.1 List gate sources with `git ls-files --cached --others --exclude-standard` over the same paths, keeping
  files on disk (design D1), and verify all three tests from 1.2 pass and `test_no_gate_source_names_a_skipped_file`
  still passes
- [ ] 2.2 Make the listing fail with a message naming git and the directory when the root isn't a git checkout or git
  is missing (design D2), add a test for each (a plain temporary directory; `PATH` without git), and verify both pass
- [ ] 2.3 Update the test's comment and docstring to say a gate's sources are what git would commit, and verify they
  match the requirement in `specs/quality-check/spec.md`

## 3. Verify where it failed

- [ ] 3.1 Run `npm run docs:sync` so `src/content/docs/docs/` holds troupe's docs, confirm a page there names
  `CLAUDE.md` (`grep -rl CLAUDE.md src/content/docs/docs`), then run `uv run scripts/check.py` and verify it passes
  without deleting the folder; record the output
- [ ] 3.2 Open the pull request with `Closes #36` and verify CI's `test` job passes

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging; merge by rebase.
- After the merge, check #36 is closed and its card on the troupe roadmap board says Done; comment on #36 with the
  pull request and the archived change.
