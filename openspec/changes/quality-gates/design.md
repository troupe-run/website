# Design: quality-gates

## Context

troupe-run/infrastructure's `quality-gates` change (infrastructure#328) built the gates and delivers
`scripts/quality_gates.py` here; its design ("Owner's decisions", 2026-11-18) is the source for what each gate does.
This design covers website's side. website's check is `scripts/check.py`, stdlib-only Python run with `uv run` and
no project environment, which drives npm; CI runs it once, in the `test` job on Linux.

## Goals / Non-Goals

**Goals:** website's thresholds in `quality-gates.toml`; complexity on every check; the audit in CI's `test` job only;
the weekly report.

**Non-goals:** coverage. The owner decided on 2026-11-18 that coverage and mutation testing apply only to the
repositories infrastructure names centrally, today troupe only (troupe-run/infrastructure#332). This change first
measured website's unit coverage too; D2 and D3 record what was found, for a later decision. Also not: refactoring
today's functions; changing what the gates measure (infrastructure's module).

## Decisions

### D1. Tools

- **lizard** becomes `scripts/check.py`'s inline script dependency (`# dependencies = ["lizard==1.26.1"]`), so
  `uv run` installs it beside the interpreter, where the module looks. Nothing else in the site needs Python.
- **No coverage tool:** `@vitest/coverage-v8` was added and then removed with the owner's decision; `package.json`,
  `package-lock.json` and `vitest.config.ts` are main's.
- **The audit** is `npm audit --package-lock-only --json`, no new tool.

### D2. Packages (not adopted: no coverage here)

Before the owner's decision, this change measured two packages: `src` (the site's TypeScript: `src/lib`, `src/scripts`
and the root `.ts` files) at 79.6% and `scripts` (the build and check tooling, `.mjs`) at 80.8% (2026-11-17, local).
They'd have been the baselines' starting point had website kept coverage. It didn't, so `quality-gates.toml` names no
baselines; its `[coverage]` table is unread until the module lets it go.

### D3. The `.astro` gap (for a later decision)

Components, layouts and pages are `.astro`: their frontmatter runs in Node while `astro build` renders them, and
their scripts in the browser. Vitest never loads them (`src/components` read 15.7% only through what unit tests
import), and lizard can't parse them. A probe (2026-11-18) ran `astro build` under `NODE_V8_COVERAGE` and mapped it
with c8: it attributed coverage to four `.ts` files and to no `.astro` file, because Astro compiles each component to
a module V8 coverage doesn't trace back to its source.

So: the gate measures `.ts` and `.mjs`, the code Vitest can see. The `.astro` files stay covered by what already tests
them: `astro check` and `tsc` (types), the build, the link checks, and the Playwright end-to-end and axe accessibility
tests on every page. Logic worth a unit test belongs in `src/lib/*.ts`, where the gate sees it; the contributing guide
says so. A follow-up issue (troupe-run/website#133) was to investigate measuring the build's server-side rendering with source maps,
and the browser scripts through Playwright's coverage API; it was closed as not planned with the owner's decision, and
comes back if website is ever added to infrastructure's list.

### D4. Where each gate runs

`check.py` gets `--base` (the spec's only accepted option) and the leg's variable, as infrastructure's:
`QUALITY_GATES_LEG=true` only under GitHub Actions, else the check stops. Complexity runs on every check, before
`npm ci`, since it needs only git and lizard. On the leg, `audit` runs after the unit tests. CI's `test` job already
fetches the whole history; it sets the variable and passes the base per event.

### D5. The weekly report

`.github/workflows/dependency-report.yml`: Mondays, `python3 scripts/quality_gates.py report`, needing only npm and
`gh` (no install), and a `board` job using website's existing `board` environment. Its first run reports today's
four moderate advisories.

### D6. Sequencing

Lands after infrastructure#328 merges and the delivery is applied, because `check.py` runs the delivered module. It
rebases onto worker #323's lint gates (website#127, merged).
