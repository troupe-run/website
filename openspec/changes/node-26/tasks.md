# Tasks

## 1. Hold the copies of the Node version to .nvmrc

- [ ] 1.1 Add `tests/unit/node-version-copies.test.ts` (design D4): a pure function that takes the texts of `.nvmrc`,
  `package.json` and `CONTRIBUTING.md` and returns the mismatches, with a case for each scenario in the spec delta
  (engines behind, CONTRIBUTING behind, no version in CONTRIBUTING, all agree) plus `engines.node` in a shape it
  refuses (`^26`, `26.x`, `>=22 || >=26`, missing), and one test that runs it on the real files. Write it while
  `.nvmrc` is still `22`: verify every case passes and the real-files test passes on main's state (22, `>=22.12.0`,
  "Node 22 or later"). Then set only `.nvmrc` to `26` and verify the real-files test fails naming both `package.json`
  and `CONTRIBUTING.md`; put `.nvmrc` back

## 2. Move to 26

- [ ] 2.1 Set `.nvmrc` to `26`, `engines.node` to `>=26.0.0` (design D2) and `CONTRIBUTING.md` to "Node 26 or later
  (the version in `.nvmrc`)". Update the root `engines` in `package-lock.json` to match, and verify `git diff
  package-lock.json` changes nothing else. Verify the test from 1.1 passes on the real files and
  `workflow-node-version.test.ts` passes with no workflow file edited (`git diff --stat .github/` is empty)
- [ ] 2.2 Change `VALID` in `scripts/node-version.mjs` to "such as 26" and its assertion in
  `tests/unit/node-version.test.ts` (design D5). Verify `npm run test:unit` passes and `node scripts/node-version.mjs`
  prints `26`

## 3. Run everything on 26

- [ ] 3.1 With `node --version` showing v26, run `rm -rf node_modules && npm ci`, then `uv run scripts/check.py`, and
  verify it passes in full; record `node --version` and the check's last line. If any gate fails, stop and report the
  output rather than changing a dependency (design, Non-Goals)
- [ ] 3.2 Open the pull request with `Closes #8` and verify CI's `test` job passes, and that its setup-node step's log
  shows a 26.x version. Record both

## 4. Before the merge

- [ ] 4.1 On or after 2026-10-28, verify `https://nodejs.org/dist/index.json` lists a 26.x release with an `lts`
  codename, and record the version and codename (design D6). If it doesn't, comment on #8 that the merge is held, and
  leave this unticked

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging; merge by rebase.
- After the merge, read the deploy run's log and confirm the Node it set up is 26.x; check the next weekly link check
  the same way.
- Check #8 is closed and its card on the troupe roadmap board says Done; comment on #8 with the pull request, the
  archived change and the deploy's Node version.
