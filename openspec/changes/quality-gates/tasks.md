# Tasks

All after the delivery of `scripts/quality_gates.py` (design D6). Load rule: check `uptime` before a full check, and
start only under 40.

## 1. Tools and config (design D1, D2)

- [ ] 1.1 Add lizard to `scripts/check.py`'s inline dependencies; add `@vitest/coverage-v8` (exact, Vitest's
      version) and check the lock diff by package. Verify `npm ci --dry-run` and `uv run scripts/check.py --help`
- [ ] 1.2 `vitest.config.ts`: provider, include, exclude and reporter, off by default. `quality-gates.toml` with the
      approved defaults. Verify `npm run test:unit` is unchanged and `python3 scripts/quality_gates.py complexity`
      passes

## 2. The check and CI (design D4)

- [ ] 2.1 `scripts/check.py`: `--base`, the leg's variable and its refusals, complexity before `npm ci`, coverage and
      audit on the leg; tests in `scripts/tests/test_check.py`. Verify they pass and a local check passes
- [ ] 2.2 `ci.yml`: the `test` job sets `QUALITY_GATES_LEG` and passes each event's base. Verify the workflow's tests
- [ ] 2.3 Baselines from this pull request's `test` job, rounded down to 0.1, and the tolerance from a second run on
      the same commit. Cite both runs

## 3. Report and docs (design D3, D5)

- [ ] 3.1 `.github/workflows/dependency-report.yml` with its board job. Verify by a test of its shape
- [ ] 3.2 CONTRIBUTING / docs: the gates, where thresholds live, and that unit-testable logic belongs in `.ts`. Raise
      the follow-up issue for `.astro` coverage on the board. Verify the issue is on the board

## Workflow follow-up

- Infrastructure's follow-up adds this repository's report to the schedule watch after its first run.
