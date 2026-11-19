# Spec Delta

## MODIFIED Requirements

### Requirement: The check runs CI's gates in CI's order
`uv run scripts/check.py` SHALL run, in this order: its own tests, the complexity gate, the size gate, install
dependencies from the lockfile, ESLint, Prettier's format check, install Playwright's Chromium, `astro check`,
`tsc --noEmit`, the unit tests, the dependency audit (on CI's audit leg only), the build, the fixture build, the rebuild
test, the brand-asset verification, the internal link check of both builds, and the end-to-end tests of both builds.

#### Scenario: Every gate passes
- **WHEN** a contributor runs `uv run scripts/check.py` on a working tree where every gate passes
- **THEN** each gate runs once, in the order above, each is reported as passed with its time, and the command exits 0

### Requirement: The check refuses arguments it doesn't take
The check SHALL take one option, `--base <commit>`, which names what the complexity, size and audit gates judge the
work against. Any other argument, including `--scope`, SHALL be refused with a usage error and a non-zero exit, before
any gate runs, because this repository declares no scopes.

#### Scenario: An unexpected argument
- **WHEN** a contributor runs `uv run scripts/check.py --scope docs`
- **THEN** it exits non-zero with a usage error and runs no gate

#### Scenario: A base is named
- **WHEN** CI runs `uv run scripts/check.py --base <sha>`
- **THEN** the complexity gate judges the functions, and the size gate the files, changed since that commit

## ADDED Requirements

### Requirement: The check runs the size gate everywhere
The check SHALL run the size gate (troupe-run/infrastructure spec: quality-gates) on every run, local and in CI, against
the same base as the complexity gate. `quality-gates.toml` SHALL declare `[size]`: warn above 32,768 bytes and block
above 49,152 (owner, 2026-11-19). Fixtures, archived changes and `package-lock.json` SHALL NOT be measured.

#### Scenario: A new file over the limit
- **WHEN** the guard runs the check before a commit that adds a text file of 60,000 bytes outside the excluded paths
- **THEN** the check fails at the size gate, naming the file and its size, and the commit is refused

#### Scenario: A file over the warning
- **WHEN** the work changes a text file of 40,000 bytes
- **THEN** the size gate notes it, naming the file, and passes

#### Scenario: Excluded paths
- **WHEN** the work changes a file under `tests/fixtures/`, under `openspec/changes/archive/`, or `package-lock.json`
- **THEN** the size gate doesn't measure it, whatever its size

### Requirement: Each file over the limit today has a ceiling and an issue to split it
`[size.allow]` SHALL give each file over 49,152 bytes when the gate was declared a ceiling of its size then, rounded up
to the KiB, plus 16 KiB, and SHALL name the issue that splits it. An entry whose file is gone or now within the limit
SHALL fail the gate until it's removed.

#### Scenario: The old site plan
- **WHEN** the work changes `docs/superpowers/plans/2026-10-07-troupe-run-site.md` and it stays at or below 146,432
  bytes
- **THEN** the size gate passes it, noting it's above the warning

#### Scenario: The file is split
- **WHEN** troupe-run/website#148 brings that file to 49,152 bytes or less and its `[size.allow]` entry stays
- **THEN** the size gate fails, saying the entry is no longer needed

### Requirement: No gate measures a delivered file
The quality gates SHALL leave out every file `.github/guard-delivery.json` names, since they're measured at their source
in troupe-run/infrastructure. `quality-gates.toml` SHALL hold no hand-written pattern for a delivered file.

#### Scenario: A delivery changes a large delivered file
- **WHEN** the work changes `scripts/guard.py` or `.github/workflows/claude-review.yml`, each over 49,152 bytes
- **THEN** neither the size gate nor the complexity gate measures it, and neither has an entry in `quality-gates.toml`
