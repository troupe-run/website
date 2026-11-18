# Spec Delta

## MODIFIED Requirements

### Requirement: The check refuses arguments it doesn't take
The check SHALL take one option, `--base <commit>`, which names what the complexity and audit gates judge the work
against. Any other argument, including `--scope`, SHALL be refused with a usage error and a non-zero exit, before any
gate runs, because this repository declares no scopes.

#### Scenario: An unexpected argument
- **WHEN** a contributor runs `uv run scripts/check.py --scope docs`
- **THEN** it exits non-zero with a usage error and runs no gate

#### Scenario: A base is named
- **WHEN** CI runs `uv run scripts/check.py --base <sha>`
- **THEN** the complexity gate judges the functions changed since that commit

## ADDED Requirements

### Requirement: The check runs the complexity gate everywhere
The check SHALL run the complexity gate (troupe-run/infrastructure spec: quality-gates) on every run, local and in CI,
over the site's TypeScript and JavaScript, with the thresholds in `quality-gates.toml`. Without `--base`, it SHALL judge
the work against where it left `origin/main`.

#### Scenario: A local commit adds a complex function
- **WHEN** the guard runs the check before a commit that adds a TypeScript function whose complexity is above the limit
- **THEN** the check fails at the complexity gate, naming the function, and the commit is refused

### Requirement: CI's test job audits the lock file, and nothing measures coverage
CI's `test` job SHALL run the dependency-audit gate over `package-lock.json`, by setting `QUALITY_GATES_LEG=true`. No
local run SHALL audit: the check SHALL fail, naming the variable, when it's set outside GitHub Actions or to anything
but `true`. website SHALL measure no coverage: only the repositories troupe-run/infrastructure names do (owner,
2026-11-18, troupe-run/infrastructure#332).

#### Scenario: The audit leg
- **WHEN** a ready pull request that changes `package-lock.json` runs CI
- **THEN** the `test` job audits it, and no step measures coverage

#### Scenario: The audit asked for locally
- **WHEN** someone runs `QUALITY_GATES_LEG=true uv run scripts/check.py` on their machine
- **THEN** the check stops before any gate, saying the audit runs in CI only and to unset the variable

### Requirement: Advisories no gate blocks on are reported weekly
website SHALL audit `package-lock.json` on `main` every week and keep one "Dependency advisories" issue up to date,
opened, updated and closed as troupe-run/infrastructure's quality-gates spec says, and SHALL put a newly opened one on
the troupe roadmap board.

#### Scenario: Advisories in the lock
- **WHEN** the weekly audit finds advisories in `package-lock.json` and no report issue is open
- **THEN** it opens one listing each of them, any severity, and the board job adds it to the board
