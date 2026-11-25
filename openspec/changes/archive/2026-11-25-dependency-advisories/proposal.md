# Proposal

## Why

The weekly dependency audit (#161) lists three moderate advisories in `package-lock.json`: glob
(GHSA-3g3m-2fjr-6pw4), minimatch (GHSA-g3hv-75wg-m249) and postcss-selector-parser (GHSA-rj75-hqrm-r3gf). All three
come in through dev tooling or the docs theme. Dependabot can't fix two of them, because a parent pins a major with no
fixed release: linkinator pins glob `^13`, and glob 13 and typescript-estree 8.72 pin minimatch `^10`. This change is
tracked by #162.

## What Changes

- postcss-selector-parser moves from 6.1.4 to the latest 6.x, within `postcss-nested`'s `^6.1.1`.
- `package.json` gains `overrides` scoped to the parents that pin the old majors: glob `^14.0.2` under `linkinator`,
  and minimatch `^11.0.1` under `@typescript-eslint/typescript-estree`. typescript-estree 8.74 asks for `^11.0.1`
  itself, so that override can go when typescript-eslint is next updated. The linkinator one can go once linkinator
  allows glob 14.
- Nothing else in the lockfile changes, apart from the dependencies of the new versions.

No spec changes: this updates dependencies, not the site's behaviour (`skip_specs: true`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

## Impact

- `package.json` (an `overrides` block) and `package-lock.json`.
- Affects linkinator (the link check), typescript-eslint and eslint (lint), and the Starlight theme's CSS nesting
  (build). Lint, tests, the build and the link check prove each one still works.
- Both overrides cross a major the parent doesn't declare, so here is what each parent calls:
  - linkinator 8.1.0 calls only `glob(fullPath)` (`build/src/options.js`), once for each path it's given. It throws
    when that returns nothing. `npm run linkcheck` passes `dist` through it, so the link check exercises the call.
    glob 14 keeps the `glob` named export and its promise of a path list.
  - typescript-estree 8.72.2 calls only `minimatch(filePath, pattern, { dot: true })`
    (`dist/useProgramFromProjectService.js`), and only with `projectService`'s `allowDefaultProject`, which this
    site's ESLint config doesn't set. 8.74.0 makes the identical call and declares `minimatch ^11.0.1` itself.
- When to remove them: the minimatch override when typescript-eslint is updated to 8.74 or later, and the glob one
  when linkinator allows glob 14. Each removal goes with that update, and the audit shows if a removal reopens an
  advisory.
