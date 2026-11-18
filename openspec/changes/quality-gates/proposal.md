# Proposal: quality-gates

## Why

troupe-run/infrastructure#321 (owner, 2026-11-17) decided that every pull request in troupe, infrastructure and
website must pass coverage, complexity and dependency-audit gates; infrastructure#322 and #324 build them. The owner
approved the defaults on 2026-11-18. The measures are one module, `scripts/quality_gates.py`, written in
infrastructure and delivered here with the guard's files (infrastructure#328); this change is website's adoption:
its thresholds, its check and its CI. website measures no coverage or complexity today, and nothing audits
`package-lock.json` on a pull request.

## What Changes

- `quality-gates.toml` at the root: website's thresholds. A complexity limit of 25 for JavaScript and TypeScript, tests
  excluded, and the audit of `package-lock.json`, blocking high and critical advisories that have a fix. No coverage:
  the owner decided on 2026-11-18 that coverage and mutation testing apply only to the repositories infrastructure
  names centrally, today troupe only (troupe-run/infrastructure#332).
- `scripts/check.py` runs the complexity gate on every check, local and CI, and the audit gate only on CI's `test` job
  (`QUALITY_GATES_LEG=true` under GitHub Actions; never locally). lizard becomes the check script's own inline
  dependency.
- `.github/workflows/ci.yml`: the `test` job sets the leg's variable and passes each event's base.
- `.github/workflows/dependency-report.yml`: the weekly "Dependency advisories" issue, with the existing `board`
  environment's board job.

## Capabilities

### New Capabilities

None. The gates' behaviour is infrastructure's `quality-gates` spec; website's own spec says where they run here.

### Modified Capabilities

- `quality-check`: the check runs the complexity gate, and CI's `test` job the audit gate, with website's thresholds in
  `quality-gates.toml`; a weekly report covers the advisories no gate blocks on; nothing measures coverage.

## Impact

- New: `quality-gates.toml`, `.github/workflows/dependency-report.yml`. Delivered (not written here):
  `scripts/quality_gates.py`.
- Changed: `scripts/check.py` and its tests, `.github/workflows/ci.yml` and its test, `README.md` where the check is
  described. No dependency changes.
- Lands after infrastructure#328 merges and its delivery is applied.
