## MODIFIED Requirements

### Requirement: CI's test job audits the lock file, and nothing measures coverage
CI's `test` job SHALL run the dependency-audit gate over `package-lock.json`, by setting `QUALITY_GATES_LEG=true`. No
local run SHALL audit: the check SHALL fail, naming the variable, when it's set outside GitHub Actions or to anything
but `true`. website SHALL measure no coverage, and its `quality-gates.toml` SHALL declare no `[coverage]`: only the
repositories troupe-run/infrastructure names do (owner, 2026-11-18, troupe-run/infrastructure#332).

#### Scenario: The audit leg
- **WHEN** a ready pull request that changes `package-lock.json` runs CI
- **THEN** the `test` job audits it, and no step measures coverage

#### Scenario: The audit asked for locally
- **WHEN** someone runs `QUALITY_GATES_LEG=true uv run scripts/check.py` on their machine
- **THEN** the check stops before any gate, saying the audit runs in CI only and to unset the variable

#### Scenario: No coverage table
- **WHEN** the check reads `quality-gates.toml`
- **THEN** it finds no `[coverage]` table, and the delivered gate reads the file without one
