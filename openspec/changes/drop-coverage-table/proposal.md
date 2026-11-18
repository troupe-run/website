# Proposal

## Why

website measures no coverage: coverage and mutation testing apply only to the repositories troupe-run/infrastructure
names in `scripts/mutation.json`, today troupe alone (owner, 2026-11-18, troupe-run/infrastructure#332). website's
`quality-gates.toml` still declares a `[coverage]` table, which nothing reads. It stayed only because the delivered
`scripts/quality_gates.py` required it. infrastructure#334's apply has now delivered a `quality_gates.py` where
`[coverage]` is optional, so the table can go (#136).

## What Changes

- Remove the `[coverage]` table, its two packages and its comment from `quality-gates.toml`. The comment that stays
  says where the decision lives (infrastructure's `scripts/mutation.json`).
- The quality-check spec's requirement on coverage says `quality-gates.toml` declares no `[coverage]`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-check`: website's gate config declares no coverage.

## Impact

- `quality-gates.toml` only. CI's `test` job already measures no coverage; with no table, the delivered gate reports
  coverage as not measured in this repository. The check, the docs and the CI comment already say website measures
  none, and are unchanged.
