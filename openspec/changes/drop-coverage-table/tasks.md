# Tasks

## 1. Remove the table

- [ ] 1.1 Confirm website's `main` has infrastructure#334's `scripts/quality_gates.py`, where `[coverage]` is optional
      (`parse_config` reads it only when present)
- [ ] 1.2 Remove `[coverage]`, `[coverage.packages.src]`, `[coverage.packages.scripts]` and their comment from
      `quality-gates.toml`; the comment left says website measures no coverage and where that's decided
      (troupe-run/infrastructure `scripts/mutation.json`)
- [ ] 1.3 Verify: `uv run scripts/quality_gates.py coverage --vitest <any path>` prints that coverage isn't measured in
      this repository, and the full check (`uv run scripts/check.py`) passes

## Workflow follow-up

- After the merge: comment on #136 with the PR and the archived change, and check its card says Done.
