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
