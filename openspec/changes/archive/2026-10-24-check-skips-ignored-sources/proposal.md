# Proposal

## Why

`scripts/check.py`'s own tests fail on any machine that has built the site (#36). The test that keeps skipped paths
out of the gates' sources reads every file under `src/`, and that includes `src/content/docs/docs/`, which git ignores
and each build fetches from troupe-run/troupe's `docs/`. troupe's `opening-night/first-performance.md` now names
`CLAUDE.md`, so after one build the guard refuses every commit that touches a path outside `openspec/**`. CI passes
only because it runs the test on a fresh checkout, before a build creates the folder. Working round it means deleting
the folder, which was done once on 2026-10-24 without the owner's go-ahead and shouldn't be needed again.

## What Changes

- `test_no_gate_source_names_a_skipped_file` reads only the gate sources git would commit: tracked files, and new
  files that aren't ignored. Files git ignores (the fetched docs, `src/generated/`) are no longer gate sources. A
  page in troupe's docs is held to its sources in troupe, not by this repository's skip list.
- The file list comes from git, not from the ignore file's patterns copied into the test, so a new ignored folder
  under `src/` or `tests/` is left out with no further edit.
- If git can't list the files (not a git checkout, git missing), the test fails and says why. It doesn't fall back
  to reading every file, which would bring the local failure back, or to reading none, which would pass unchecked.
- New tests, in a throwaway git repository, show that an ignored page naming `CLAUDE.md` isn't reported, and that a
  tracked file and a new untracked file under `src/` naming it still are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-check`: the requirement "Paths no gate reads skip the check" says which files count as a gate's sources
  (what git would commit, not what it ignores), and gains scenarios for a generated page and for a tracked one.

## Impact

- `scripts/tests/test_check.py` only: the gate-source list and the test that reads it. No gate, script, config or
  page changes, and `scripts/check-paths.toml` keeps its paths.
- The guard's files (`scripts/guard.py`, hooks) are delivered from troupe-run/infrastructure and aren't touched.
- Locally, `uv run scripts/check.py` passes after a build without deleting `src/content/docs/docs/`. CI's result is
  unchanged.
