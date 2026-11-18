# Design: quality-gates

## Context

troupe-run/infrastructure's `quality-gates` change (infrastructure#328) built the gates and delivers
`scripts/quality_gates.py` here; its design ("Owner's decisions", 2026-11-18) is the source for what each gate does.
This design covers website's side. website's check is `scripts/check.py`, stdlib-only Python run with `uv run` and
no project environment, which drives npm; CI runs it once, in the `test` job on Linux.

## Goals / Non-Goals

**Goals:** website's thresholds in `quality-gates.toml`; complexity on every check; coverage and the audit in CI's
`test` job only; the weekly report; a clear account of what coverage can't see.

**Non-goals:** measuring the end-to-end tests' coverage; refactoring today's functions; changing what the gates
measure (infrastructure's module).

## Decisions

### D1. Tools

- **lizard** becomes `scripts/check.py`'s inline script dependency (`# dependencies = ["lizard==1.26.1"]`), so
  `uv run` installs it beside the interpreter, where the module looks. Nothing else in the site needs Python.
- **Coverage** comes from Vitest's V8 provider, `@vitest/coverage-v8` at Vitest's version, a new dev dependency added
  with `npm install --save-dev --save-exact` and the lock file checked by package (only it and its dependencies
  change). `vitest.config.ts` names the provider, what's measured (`src/**/*.ts`, `scripts/**/*.mjs`, tests excluded)
  and the `json-summary` reporter; it stays off until the leg passes `--coverage.enabled`.
- **The audit** is `npm audit --package-lock-only --json`, no new tool.

### D2. Packages

Two: `src` (the site's TypeScript: `src/lib`, `src/scripts` and the root `.ts` files) and `scripts` (the build and
check tooling, `.mjs`). Today: `src` 79.6%, `scripts` 80.8% (2026-11-17, local); the baselines are the `test` job's
measurement on this pull request, rounded down to 0.1, with the tolerance from a second run on the same commit.

### D3. The `.astro` gap

Components, layouts and pages are `.astro`: their frontmatter runs in Node while `astro build` renders them, and
their scripts in the browser. Vitest never loads them (`src/components` read 15.7% only through what unit tests
import), and lizard can't parse them. A probe (2026-11-18) ran `astro build` under `NODE_V8_COVERAGE` and mapped it
with c8: it attributed coverage to four `.ts` files and to no `.astro` file, because Astro compiles each component to
a module V8 coverage doesn't trace back to its source.

So: the gate measures `.ts` and `.mjs`, the code Vitest can see. The `.astro` files stay covered by what already tests
them: `astro check` and `tsc` (types), the build, the link checks, and the Playwright end-to-end and axe accessibility
tests on every page. Logic worth a unit test belongs in `src/lib/*.ts`, where the gate sees it; the contributing guide
says so. A follow-up issue (troupe-run/website#133, on the board) investigates measuring the build's server-side rendering with source maps,
and the browser scripts through Playwright's coverage API.

### D4. Where each gate runs

`check.py` gets `--base` (the spec's only accepted option) and the leg's variable, as infrastructure's:
`QUALITY_GATES_LEG=true` only under GitHub Actions, else the check stops. Complexity runs on every check, before
`npm ci`, since it needs only git and lizard. On the leg, `unit tests` runs with coverage and writes its summary to the
runner's temporary directory, and `coverage` and `audit` run after it. CI's `test` job already fetches the whole
history; it sets the variable and passes the base per event.

### D5. The weekly report

`.github/workflows/dependency-report.yml`: Mondays, `python3 scripts/quality_gates.py report`, needing only npm and
`gh` (no install), and a `board` job using website's existing `board` environment. Its first run reports today's
four moderate advisories.

### D6. Sequencing

Lands after infrastructure#328 merges and the delivery is applied, because `check.py` runs the delivered module. It
rebases onto worker #323's lint gates (website#127, merged).
