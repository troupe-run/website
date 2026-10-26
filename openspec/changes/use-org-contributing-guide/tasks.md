# Tasks

## 1. The test that states the rule, first

- [ ] 1.1 Add `scripts/tests/test_contributing.py` (design D4) with two tests: no `CONTRIBUTING.md` (any case) at the
  root, in `.github/` or in `docs/`; and no file git would commit, outside `docs/superpowers/` and
  `openspec/changes/`, links to `CONTRIBUTING.md` by a non-URL Markdown target or `href`. Each failure names the file.
  Verify with `python -m unittest discover -s scripts/tests` that the first fails on `CONTRIBUTING.md` and the second
  names `README.md` and `CLAUDE.md`, and nothing else; record the output
- [ ] 1.2 Check the link test against the org guide's URL by running it with `src/lib/docs-nav.ts` and
  `tests/e2e/docs.spec.ts` in its file list, and verify neither is reported

## 2. Move the setup notes to the README

- [ ] 2.1 Add **Setting up**, **Running it locally** and **Fixing or improving a page** to `README.md`, moved from
  `CONTRIBUTING.md` unchanged except for references to the file itself (design D1), including the
  `TROUPE_MILESTONES` note and the rebuild test. Verify by diffing each moved section against `CONTRIBUTING.md`
  (`git diff --no-index` on the extracted sections) and listing every changed line
- [ ] 2.2 In **Fixing or improving a page**, keep the sentence that an outside contributor's `guard` check fails and
  that's expected, and link the org guide's `#a-fix-from-outside` section for what happens next (design D2). Verify
  the anchor resolves by opening the org guide on GitHub at that anchor
- [ ] 2.3 Replace the "Development" paragraph's pointer to `CONTRIBUTING.md` with a link to the org guide for how work
  flows, commit messages, sign-off and contribution terms, and add the org guide link to the licence section. Verify
  README.md against each README scenario in `specs/contributing/spec.md`, one by one, and that it never mentions
  `git commit -s` or `Signed-off-by:`

## 3. Point everything else away from the file, and delete it

- [ ] 3.1 In `CLAUDE.md`, replace `[CONTRIBUTING.md](CONTRIBUTING.md) for setting up` with the README for setting up
  and the org guide for contributing (design D3), keeping the workflow and the no-sign-off line. Verify against the
  CLAUDE.md scenarios in `specs/contributing/spec.md`
- [ ] 3.2 Remove `"CONTRIBUTING.md"` from `scripts/check-paths.toml`'s `skip` paths and update the comment's list
  (design D5). Verify `test_check.py`'s `CheckPaths` tests pass
- [ ] 3.3 Delete `CONTRIBUTING.md` with `git rm`. Verify both tests in `scripts/tests/test_contributing.py` now pass,
  and `grep -rn "CONTRIBUTING" --exclude-dir={node_modules,.git,.cache,dist,dist-fixture} .` shows only the org
  guide's URL, the specs, `docs/superpowers/` and `openspec/changes/`

## 4. Verify the whole

- [ ] 4.1 Run `uv run scripts/check.py` and verify it passes; record the output
- [ ] 4.2 Show the owner the README's new sections as text (the rendered README on the branch), and verify they've
  reviewed it before the pull request is opened
- [ ] 4.3 Open the pull request with `Closes #31` and verify CI's `test` job passes

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging; merge by rebase.
- After the merge, open website's contributing link on GitHub (the repository's Contributing tab or
  `https://github.com/troupe-run/website/contribute`) and verify it shows the org guide.
- Check #31 is closed and its card on the troupe roadmap board says Done; comment on #31 with the pull request and
  the archived change.
