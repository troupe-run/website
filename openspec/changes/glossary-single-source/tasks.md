# Tasks

## 1. The tests, written first (D5)

- [x] 1.1 Write `tests/unit/vocabulary.test.ts` with the table reader, the `GLOSSARY` and `BRAND_GUIDE` constants and
  every test in D5, against the files as they are on main. Verify: `npm run test:unit` fails, and each failure is one
  this change is meant to fix: the guide's table has a Meaning column; gate, escalation and lineage have no status;
  stage, rehearsal, `system` and cue have no rows; "TBC" and "isn't final" are found; the four theatre uses of
  "project" in D4 are unrecorded. Save the output to the scratchpad.
- [x] 1.2 Check the "project" record catches what it should, by hand: add "your project" to a docs page, and remove a
  recorded line from another. Verify: the first fails naming the file and line, the second fails naming the stale
  record. Then restore both files with `git restore` and check `git status` shows only the new test.
- Not committed yet: `scripts/check.py` runs the unit tests, and they pass only once groups 2 to 4 are done. The test
  lands in 4.4's commit, and 1.1's saved output is the record that it failed first.

## 2. The glossary and the house page (D1, D4)

- [x] 2.1 Rewrite the glossary's table to D1's rows and order. Update the house page's title and purpose (D4).
  Verify: the glossary, decided-terms and house tests in `npm run test:unit` pass; the term-set test still fails only
  on the guide's side.
- [x] 2.2 Build and look at `/docs/prompt-book/glossary/` and `/docs/the-company/the-house/` at 320px and desktop,
  light and dark. Verify: `npm run build` passes, the e2e test `glossary at 320px has no page-level horizontal scroll`
  passes, and screenshots are saved to the scratchpad.
- [x] 2.3 Show the owner the glossary's text and the house page's title and purpose. Verify: the owner's approval or
  edits are recorded in this task before ticking it.
  Owner, 2026-10-19: approved the glossary text and house page from the screenshots ("the screenshots look
  good"). The empty planned pages go to troupe-run/troupe#123, not this change.

## 3. The brand guide and the project context (D2, D3, D6)

- [x] 3.1 Replace §6's vocabulary paragraph and table with D2's link and Term | Status table, one row per term, and add
  D3's sentence on product nouns. Verify: every test that reads the brand guide passes, including the term-set test.
- [x] 3.2 Change §7's bullet to D3's text and remove §10's last bullet. Verify: the house test passes; `grep -n
  'TBC\|house rules' docs/brand-guide.md` finds only the rejected "house rules" row.
- [x] 3.3 Update `openspec/config.yaml`'s two context lines (D6). Verify: `openspec validate glossary-single-source
  --strict` passes and `grep -n 'TBC\|says "project"' openspec/config.yaml` finds nothing.

## 4. Site copy says "theatre" (D4)

- [x] 4.1 Make D4's edits to `what-is-troupe.md`, `principles.md` and `src/content/copy/principles.md`. Leave the
  recorded uses (footer, contributing, the glossary's theatre row) and the blog as they are. Verify: the "project" record
  test passes, and the record lists exactly those stays, each with its reason.
  Found while doing it: `tests/e2e/landing.spec.ts` exempted the exact text "Config, history and decisions live in
  git" from its no-"config" check, and was named for the old rule ('says "project"', which it never checked). The
  exemption now matches "its config, history and decisions live in git", and the name says what the body checks.
- [x] 4.2 Build and look at the landing page's principles and the two docs pages at 320px and desktop, light and
  dark. Verify: `npm run build` and `npm run test:e2e` pass (axe included), and screenshots are saved to the
  scratchpad. Under an agent, use the workaround in the "astro preview backgrounds under agents" memory.
- [x] 4.3 Show the owner the landing and docs copy as text, before and after, with the screenshots. Verify: the
  owner's approval or edits are recorded in this task before ticking it.
  Owner, 2026-10-19: approved the landing and docs copy from the screenshots ("the screenshots look good").
  The empty planned pages go to troupe-run/troupe#123, not this change.
- [x] 4.4 Narrow `scripts/check-paths.toml`'s skip from `docs/**` to `docs/superpowers/**` (D5), because the new test
  reads the brand guide. Found when the guard refused 4.5's first try. Verify: `python3 -m unittest discover -s
  scripts/tests` passes.
- [ ] 4.5 Commit the test, glossary, house page, brand guide, config and copy together ("feat(docs): the glossary is
  the single source of troupe's vocabulary", body naming troupe-run/troupe#15 and #22). They go in one commit because
  the test passes only when all of them agree. Verify: `uv run scripts/check.py` passes before the commit, and `git
  status` is clean after it.

## 5. Integration

- [ ] 5.1 Run `uv run scripts/check.py`. Verify: it passes, and its output is saved to the scratchpad.

## Workflow follow-up

- Open the pull request with `Closes #22`, its body written with `--body-file`. CI's `test` job passes.
- Run `/opsx:archive` on the branch before merging; merge by rebase.
- After the merge: check #22 is closed and its card on the troupe roadmap board says Done; comment on #22 with the
  pull request and the archived change. Note on troupe-run/troupe#120 or #23 that the glossary's path is in two places
  (the guide's link, the test's constant) for the move.
