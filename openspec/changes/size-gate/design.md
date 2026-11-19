# Design

## Context

The delivered `scripts/quality_gates.py` (troupe-run/infrastructure#349, `gate-files`) has a `size` subcommand that
reads `[size]` from `quality-gates.toml` and prints "not declared" while it's absent. It measures each text file the
work adds or changes since the base (CRLF counted as LF), skips binaries, `exclude` patterns and every file in
`.github/guard-delivery.json`, and fails a file above its limit that's new or grew. `scripts/check.py` runs only the
complexity gate today.

Files over 49,152 bytes on `main` (c782248, `git ls-files`): the four fixture copies of `error.schema.json` (excluded),
three PNGs (binary), `scripts/guard.py` and `.github/workflows/claude-review.yml` (delivered), `package-lock.json`
(excluded), and `docs/superpowers/plans/2026-10-07-troupe-run-site.md` (129,208 bytes). Only the last needs an
allowance.

## Goals / Non-Goals

**Goals:** declare `[size]` and run it in every check; show the delivered-file exclusion covers every delivered file.

**Non-Goals:** splitting the plan (troupe-run/website#148); making `[size]` required (troupe-run/infrastructure#358);
changing the delivered script.

## Decisions

**D1. The size gate runs right after complexity, before `npm ci`.** Like complexity it needs only git and Python, so it
fails fast before anything is installed. It takes `--base` the same way, so CI judges the pull request against its base
and a local run against where the work left `origin/main`.

**D2. Ceilings are the size rounded up to the KiB, plus 16 KiB.** That's infrastructure's convention for the same limits
(its `quality-gates.toml`: `scripts/guard.py` 205,573 → 222,208), and gives the figure the issue records: 129,208 →
127 KiB → 143 KiB = 146,432.

**D3. `exclude` is `**/fixtures/**`, `openspec/changes/archive/**`, `package-lock.json`.** Fixtures copy troupe's files
and are reviewed there; archived changes are frozen records; the lock file is generated. These match infrastructure's
exclusions, with website's lock file for `uv.lock`.

**D4. Nothing to remove from `[complexity] exclude`.** It holds only `**/tests/**` and `tests/**`, which aren't delivered
files. The proof the delivery list covers them is a run of both gates over a base before every delivered file
(`git log --diff-filter=A` on `scripts/guard.py`), recorded in the tasks: each delivered file is changed in that range
and neither gate names one.

## Risks / Trade-offs

- [The gate fails a commit that touches the plan and grows it past 146,432] → that's the point; split it under #148.
- [The allowance outlives the split] → the gate fails on a stale entry, so the split's PR removes it.
