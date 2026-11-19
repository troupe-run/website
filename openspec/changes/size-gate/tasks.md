# Tasks

## 1. Declare the size gate

- [ ] 1.1 Add `[size]` (block_above 49152, warn_above 32768, exclude fixtures, archived changes, `package-lock.json`)
      and `[size.allow]` (the site plan at 146432, naming troupe-run/website#148) to `quality-gates.toml`, with a
      comment citing the owner's 2026-11-19 limits; verify `uv run scripts/quality_gates.py size --base origin/main`
      reads it and passes
- [ ] 1.2 Show the stale-entry rule holds: with the plan's entry set to a path that doesn't exist, the size gate fails
      naming it; restore and verify it passes again

## 2. Run it in the check

- [ ] 2.1 Add the `size` step after `complexity` in `scripts/check.py` with the base, and its label to
      `scripts/tests/test_check.py`'s order plus a test that it takes `--base`; verify
      `python3 -m unittest discover -s scripts/tests` passes
- [ ] 2.2 Update `README.md`'s description of the check to name the size gate and its limits; verify by reading it
      against `quality-gates.toml`

## 3. Delivered files

- [ ] 3.1 Confirm `[complexity] exclude` holds no delivered-file pattern; run `quality_gates.py size` and
      `quality_gates.py complexity` against a base before the first delivery, and verify neither names any file in
      `.github/guard-delivery.json` though each is changed in that range; record the output in the PR

## 4. Integration

- [ ] 4.1 Run the full `uv run scripts/check.py` (after the orchestrator grants the heavy-run slot) and verify it ends
      `check: all gates passed` with the size gate reported

## Workflow follow-up

- Draft PR closing troupe-run/website#149, no milestone; act on Claude's review; archive on the branch before merge.
