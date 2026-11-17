# Design

## Context

See proposal.md for why. `scripts/check.py` runs its own tests, `npm ci`, Playwright's Chromium, `astro check`, the
unit tests, the builds, the asset check, the link checks and the end-to-end tests, the same in CI's `test` job. The
code is TypeScript (`src/**/*.ts`, `tests/**/*.ts`), JavaScript modules (`scripts/*.mjs`, the root configs) and Astro
components, in single quotes with semicolons, wrapped at 120 columns. `tsconfig.json` extends Astro's `strict` and
includes everything; `astro check` already type-checks `.astro` and `.ts`.

## Goals / Non-Goals

**Goals:** the three gates block locally and in CI, the existing code passes them when they land, and each tool's
rules live in one file.

**Non-Goals:** type-aware ESLint rules (they need the whole program per file and slow the gate; `tsc` already checks
types); formatting Markdown or MDX (the docs and blog prose follow the brand guide's own wrapping); CI changes.

## Decisions

### D1. The lint gates run right after `npm ci`

They need only `node_modules` and take seconds, so they go before Playwright's download and `astro check`: a lint or
format error fails fast. Order: `eslint`, `prettier`, `tsc`, each through `npx --no-install` so nothing is fetched
that the lockfile doesn't hold. Each is also an npm script (`lint`, `format:check`, `typecheck`), so a contributor can
run one alone.

### D2. ESLint: the recommended presets, flat config

`eslint.config.js`: `@eslint/js` recommended, `typescript-eslint`'s `recommended` (not type-checked, D-non-goal),
eslint-plugin-astro's `recommended`, and `globals` for Node in `scripts/` and the configs and for the browser in
`src/scripts/`. Ignores what `.gitignore` ignores plus `public/`, `brand/` output and `src/generated/`. A rule turned
off carries its reason beside it; that's the baseline #323 allows.

### D3. Prettier keeps the existing style, over code and styles only

`.prettierrc.json`: `singleQuote`, `semi`, `printWidth: 120`, prettier-plugin-astro. `.prettierignore`: Markdown and
MDX, generated and synced content (`src/content/docs/docs/`, `src/generated/`, `public/protocol/`), the lockfile,
`dist*`, and the guard's delivered files (`.github/workflows/guard.yml`, `claude-review.yml`, `dependabot-dispatch.yml`,
`.claude/settings.json`), which are written in infrastructure and would be reformatted on every delivery. The first
`prettier --write` lands as its own commit, with nothing else in it, so the reformat is easy to review.

*Alternative:* Prettier's defaults (80 columns, double quotes): rejected, it would rewrite nearly every line.

### D4. `tsc --noEmit` with the existing tsconfig

`tsc --noEmit -p tsconfig.json`. It can't read `.astro` files, which `astro check` keeps covering; it catches errors in
`.ts` files with the compiler's own rules. If it reports errors `astro check` doesn't, they're fixed.

### D5. Dependencies pinned exactly, a week old or more

`eslint` 10.14.0, `@eslint/js` 10.0.1, `typescript-eslint` 8.72.1, `eslint-plugin-astro` 3.2.1, `globals` 17.14.0,
`prettier` 3.9.10, `prettier-plugin-astro` 1.1.2: the newest at least 14 days old on 2026-11-17, past the org's
Dependabot cooldown. Added with `npm install -D -E` after `npm ci`, and the lockfile checked by package so only these
and their own dependencies change.

## Risks / Trade-offs

- **The reformat touches many files** → one formatting-only commit; open pull requests rebase onto it (Prettier on
  their files fixes most conflicts).
- **eslint-plugin-astro's peer list names jsx-a11y plugins** → they're optional peers; if npm insists, the design
  comes back rather than adding them silently.
- **ESLint 10 is a major version new to this repository** → it's past the 14-day cooldown for a major.
