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

### D1. ESLint and Prettier run right after `npm ci`; `tsc` right after `astro check`

ESLint and Prettier need only `node_modules` and take seconds, so they go before Playwright's download and `astro
check`: a lint or format error fails fast. `tsc` needs the types Astro generates (`.astro/types.d.ts`, the content
collections), which `astro check` writes, so it runs right after it (a trial on 2026-11-18 found 17 errors from
missing generated types before, none after). Each is an npm script (`lint`, `format:check`, `typecheck`), run with `npm run` like the check's
other gates, so it runs only what `npm ci` installed from the lockfile, and a contributor can run one alone.

### D2. ESLint: the recommended presets, flat config

`eslint.config.js`: `@eslint/js` recommended, `typescript-eslint`'s `recommended` (not type-checked, D-non-goal),
eslint-plugin-astro's `recommended`, and `globals` for Node in `scripts/` and the configs and for the browser in
`src/scripts/`. Ignores what `.gitignore` ignores plus `public/`, `brand/` output and `src/generated/`. A rule turned
off carries its reason beside it; that's the baseline #323 allows.

### D3. Prettier keeps the existing style, over code and styles only

`.prettierrc.json`: `singleQuote`, `semi`, `printWidth: 120`, prettier-plugin-astro. Prettier's scope is set by the
`format:check` script's glob, which names only code and styles (`ts`, `mts`, `mjs`, `js`, `astro`, `css`), so Markdown,
MDX, the lockfile and the guard's delivered workflows and settings are never read. `.prettierignore`, whose header
says why, then leaves out what the glob would otherwise reach: build output, generated and synced content
(`src/content/docs/docs/`, `src/generated/`, `public/`), and the brand images' render inputs (`brand/`,
`scripts/assets.config.mjs`), whose hashes the asset check records against the committed images, so a reformat would
read as a change needing a re-render (found when the first reformat failed that check). The first
`prettier --write` lands as its own commit, with only `.prettierignore` and this change's own files beside it, so the
reformat is easy to review.

*Alternative:* Prettier's defaults (80 columns, double quotes): rejected, it would rewrite nearly every line.

### D4. `tsc --noEmit` with the existing tsconfig, and the declarations plain tsc lacks

`tsc --noEmit -p tsconfig.json`. Plain tsc doesn't understand what Astro's checker does, so `src/env.d.ts` declares
two things it needs: `.astro` modules (as Astro component factories), and starlight-blog's virtual modules, by
referencing the package's own `virtual.d.ts` (its shipped TypeScript imports them). `astro check` keeps checking the
components themselves; tsc catches errors in `.ts` files with the compiler's own rules.

### D5. Dependencies pinned exactly, a week old or more

`eslint` 10.14.0, `@eslint/js` 10.0.1, `typescript-eslint` 8.72.1, `eslint-plugin-astro` 3.2.1, `globals` 17.14.0,
`prettier` 3.9.10, `prettier-plugin-astro` 1.1.2: the newest at least 14 days old on 2026-11-17, past the org's
Dependabot cooldown. Added with `npm install -D -E` after `npm ci`, and the lockfile checked by package so only these
and their own dependencies change.

### D6. Today's findings: fixed, or exempted on the line with the reason (trial, 2026-11-18)

ESLint found five problems. Two are fixed: a rethrown error now carries its `cause`, and a test's `any` became the
shape it reads. Three are exempted on the line, with the reason beside them: `document` in code Playwright runs in the
page, a regular expression that matches control characters because refusing them is its job, and the triple-slash
reference in `src/env.d.ts`, since an ambient declaration file has no import to use. Prettier reformats 107 files.

## Risks / Trade-offs

- **The reformat touches many files** → one formatting-only commit; open pull requests rebase onto it (Prettier on
  their files fixes most conflicts).
- **eslint-plugin-astro's peer list names jsx-a11y plugins** → they're optional peers; if npm insists, the design
  comes back rather than adding them silently.
- **ESLint 10 is a major version new to this repository** → it's past the 14-day cooldown for a major.
