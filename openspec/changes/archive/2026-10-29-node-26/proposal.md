# Proposal

## Why

The site builds, tests and deploys on Node 22, which has been in maintenance (security fixes only) since 2025-10-21
and reaches end of life on 2027-04-30. Node 26 becomes LTS on 2026-10-28 and is supported until 2029-04-30, so moving
to it now buys two and a half years before the next move. We skip 24, which went to maintenance on 2026-10-20
(troupe-run/website#8, citing the [Node.js release schedule](https://github.com/nodejs/Release/blob/main/schedule.json)).

Since #4, `.nvmrc` is the only place CI, the deploy and the weekly link check take their Node version from. Two
other places still repeat it for people: `engines.node` in `package.json` (`>=22.12.0`) and "Node 22 or later" in
`README.md`. Nothing checks they agree with `.nvmrc`, so a move like this one can leave either behind.

## What Changes

- `.nvmrc` goes from `22` to `26`. Every workflow follows it with no workflow file edited (spec: build-and-deploy).
- `engines.node` in `package.json` goes from `>=22.12.0` to `>=26.0.0`.
- `README.md` says "Node 26 or later".
- A unit test fails when `engines.node`'s lowest major or the version `README.md` names differs from the major in
  `.nvmrc`, and names the file that's behind. The next move then has a test that says where to change it.
- The example in `.nvmrc`'s refusal message ("such as 22") becomes "such as 26", so it shows the version in use.
- No dependency changes. Every pinned package's `engines` range in `package-lock.json` admits 26 (Astro 7.3.6 and
  Starlight 0.42.5 need `>=22.12.0`, Playwright 1.63.0 `>=20`, vitest 5.0.3 lists `>=26.0.0` explicitly). CI's full
  check run on 26 is what shows they work, not the ranges.
- The pull request merges on or after 2026-10-28, once 26 is LTS, because every merge to `main` deploys.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `build-and-deploy`: adds a requirement that the copies of the Node version written for people (`engines.node` and
  `README.md`) agree with `.nvmrc`, and that a check fails when they don't.

## Impact

- `README.md` comes off the guard's skip list in `scripts/check-paths.toml`, because a test now reads it. A
  commit touching only it runs the full check.
- Files: `.nvmrc`, `package.json`, `README.md`, `scripts/check-paths.toml`, `scripts/node-version.mjs` (message only),
  `tests/unit/node-version.test.ts`, a new unit test beside `tests/unit/workflow-node-version.test.ts`.
- `package-lock.json`'s root `engines` mirrors `package.json` and changes with it. Nothing else in it should.
- Contributors need Node 26. npm only warns on an `engines` mismatch (there's no `engine-strict`), and
  `scripts/check.py` already names the `.nvmrc` version when Node is missing.
- CI, the deploy and the weekly link check run on 26 from the merge on. The first deploy's log is the check that the
  production build used it.
- Workflow files, the guard's files and troupe-run/infrastructure are untouched.
