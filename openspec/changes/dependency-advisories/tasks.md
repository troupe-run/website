# Tasks

## 1. Update the three packages

- [ ] 1.1 Start from the committed lockfile, with `node_modules` matching it: `git checkout HEAD -- package-lock.json`,
  then `npm ci`. Verify `npm ci --dry-run` reports no mismatch.
- [ ] 1.2 Update postcss-selector-parser within its range: `npm update postcss-selector-parser --package-lock-only`.
  Verify `node_modules/postcss-selector-parser` in the lockfile is 6.1.5 or later, and 7.x is unchanged.
- [ ] 1.3 Add the scoped `overrides` to `package.json`: glob `^14.0.2` under `linkinator`, and minimatch `^11.0.1`
  under `@typescript-eslint/typescript-estree`. Then `npm update glob minimatch --package-lock-only`. Verify no locked
  glob is below 14.0.2, and no minimatch below 11.0.1.
- [ ] 1.4 Diff the lockfile by package, not text: compare each `packages` key and version in
  `git show HEAD:package-lock.json` with the working copy. Verify every changed entry is one of the three packages, or
  a dependency their new versions bring in.
- [ ] 1.5 Check the new versions against the advisory database
  (`gh api "/advisories?ecosystem=npm&affects=<name>@<version>"` for each). Verify none is affected, and that
  `npm audit` lists no advisory for glob, minimatch or postcss-selector-parser.

## 2. Verify

- [ ] 2.1 `npm ci`, then run `npm run lint`, the tests, the build and the link check. Verify each passes.
- [ ] 2.2 Run `uv run scripts/check.py`. Verify it passes.
- [ ] 2.3 Open a draft pull request with `Closes #162` that links #161, using `--body-file`, and act on Claude's
  review. Verify the review of the last push completed with no must-fix or decision open, and CI passes.
