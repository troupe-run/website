# Proposal

## Why

troupe-run/infrastructure#349 (change `gate-files`) delivered a size gate in `scripts/quality_gates.py`, with `[size]`
optional until troupe and website declare it (troupe-run/infrastructure#358 then makes it required). A review reads
every changed file whole, and a file too big for one or two Reads goes partly unread. The same delivery made every gate
leave out the files `.github/guard-delivery.json` lists, so website no longer needs hand-written patterns for them.
Issue: troupe-run/website#149.

## What Changes

- `quality-gates.toml` declares `[size]` with the owner's limits (2026-11-19): warn above 32 KiB (32,768 bytes), block
  above 48 KiB (49,152 bytes). Fixtures, archived changes and the lock file aren't measured.
- `[size.allow]` gives the one file over 48 KiB today, `docs/superpowers/plans/2026-10-07-troupe-run-site.md`
  (129,208 bytes), a ceiling of its size rounded up to the KiB plus 16 KiB: 146,432 bytes. troupe-run/website#148
  splits it, and the entry goes when it does (the gate fails on an entry that's no longer needed).
- `scripts/check.py` runs the size gate on every run, local and in CI, right after the complexity gate, and judges the
  work against the same base.
- Delivered files: `[complexity] exclude` has no hand-written pattern for a delivered file (only the tests), so there's
  nothing to remove. The change shows the gates leave out every file the delivery list names instead.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-check`: the check's gate order gains the size gate after complexity. A new requirement covers what the size
  gate measures here, its limits, and that delivered files are left out.

## Impact

- `quality-gates.toml`, `scripts/check.py`, `scripts/tests/test_check.py`, `README.md` (the check's gate list).
- No site code or build output changes. No new dependency: the size gate is standard-library Python in the delivered
  script.
