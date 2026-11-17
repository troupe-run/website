# Proposal

## Why

troupe-run/infrastructure#321 decided the gates every pull request must pass (owner, 2026-11-17), so that pull
requests can later merge without the owner (#320). website's check type-checks with `astro check` and runs its tests,
but nothing lints its TypeScript and JavaScript or holds its formatting. troupe-run/website#126 is website's half of
troupe-run/infrastructure#323: ESLint, Prettier and `tsc --noEmit`, blocking, locally and in CI.

## What Changes

- **Three gates join the check**, after `npm ci` and before `astro check`, so a lint error fails in seconds:
  `eslint` (lint), `prettier --check` (format) and `tsc --noEmit` (types).
- **ESLint** (`eslint.config.js`): ESLint's recommended rules, typescript-eslint's recommended rules for `.ts`, and
  eslint-plugin-astro's recommended rules for `.astro`, over `src/`, `scripts/`, `tests/` and the root config files.
- **Prettier** (`.prettierrc.json`, `.prettierignore`): the repository's existing style (single quotes, semicolons,
  120 columns), with prettier-plugin-astro for `.astro`. It covers code and styles; Markdown and MDX prose, generated
  and delivered files are left out.
- **Existing code is brought into line**: one formatting commit from `prettier --write`, and each ESLint finding fixed,
  or turned off in `eslint.config.js` with the reason beside it (the recorded baseline #323 allows).
- New dev dependencies, pinned exactly at versions at least a week old (the org's Dependabot cooldown): `eslint`,
  `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro`, `globals`, `prettier`, `prettier-plugin-astro`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-check`: the check's gates, in order, gain the three linters.

## Impact

- `scripts/check.py` and its tests, `package.json`, `package-lock.json` (changed only by the new packages), the new
  config files, and every file Prettier reformats.
- CI is unchanged: its `test` job runs `scripts/check.py`.
- Not here: mutation testing (troupe-run/infrastructure#325), which reads website's code from infrastructure and
  changes no file here.
