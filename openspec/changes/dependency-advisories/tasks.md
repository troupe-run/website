# Tasks

## 1. Update the three packages

- [x] 1.1 Start from the committed lockfile, with `node_modules` matching it: `git checkout HEAD -- package-lock.json`,
  then `npm ci`. Verify `npm ci --dry-run` reports no mismatch.
  Done: `npm ci --dry-run` exited 0.
- [x] 1.2 Update postcss-selector-parser within its range: `npm update postcss-selector-parser --package-lock-only`.
  Verify `node_modules/postcss-selector-parser` in the lockfile is 6.1.5 or later, and 7.x is unchanged.
  Done: 6.1.4 → 6.1.6. 6.1.6 no longer depends on `cssesc`, so that entry went. eslint-plugin-astro's 7.2.1 is
  unchanged.
- [x] 1.3 Add the scoped `overrides` to `package.json`: glob `^14.0.2` under `linkinator`, and minimatch `^11.0.1`
  under `@typescript-eslint/typescript-estree`. Then `npm update glob minimatch --package-lock-only`. Verify no locked
  glob is below 14.0.2, and no minimatch below 11.0.1.
  Done: glob 13.0.6 → 14.0.6, minimatch 10.2.6 → 11.0.9 (the only copies left).
- [x] 1.4 Diff the lockfile by package, not text: compare each `packages` key and version in
  `git show HEAD:package-lock.json` with the working copy. Verify every changed entry is one of the three packages, or
  a dependency their new versions bring in.
  Done: postcss-selector-parser, glob and minimatch changed. path-scurry 2.0.2 → 3.0.0 (glob 14 needs `^3.0.0`).
  eslint's and @eslint/config-array's nested minimatch (11.0.8, 11.0.9) went, now served by the hoisted 11.0.9.
  cssesc 3.0.0 went (1.2). Nothing else.
- [x] 1.5 Check the new versions against the advisory database
  (`gh api "/advisories?ecosystem=npm&affects=<name>@<version>"` for each). Verify none is affected, and that
  `npm audit` lists no advisory for glob, minimatch or postcss-selector-parser.
  Done: no advisory affects glob@14.0.6, minimatch@11.0.9, postcss-selector-parser@6.1.6 or path-scurry@3.0.0. The
  same query lists each advisory for the old versions. `npm audit` reports 0 at every severity.

## 2. Verify

- [x] 2.1 `npm ci`, then run `npm run lint`, the tests, the build and the link check. Verify each passes.
  Done: `npm ci`, then `lint`, `test:unit`, `build`, `linkcheck` and `typecheck` all exited 0. `typecheck` needs the
  build's generated files first.
- [x] 2.2 Run `uv run scripts/check.py`. Verify it passes.
  Done: all gates passed, e2e included (275 passed).
- [ ] 2.3 Open a draft pull request with `Closes #162` that links #161, using `--body-file`, and act on Claude's
  review. Verify the review of the last push completed with no must-fix or decision open, and CI passes.
