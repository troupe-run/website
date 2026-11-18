# Tasks

All after the delivery of `scripts/quality_gates.py` (design D6). Load rule: check `uptime` before a full check, and
start only under 40.

## 1. Tools and config (design D1)

- [x] 1.1 Add lizard to `scripts/check.py`'s inline dependencies. Verify `uv run scripts/check.py --help`. Done
- [x] 1.2 `quality-gates.toml` with the approved complexity and audit defaults. Verify
      `python3 scripts/quality_gates.py complexity` passes. Done. Its `[coverage]` table stays, unread, because the
      delivered module requires one; removing it is the follow-up below
- [x] 1.3 Remove the coverage parts this change first added: `@vitest/coverage-v8` (`package.json` and
      `package-lock.json` back to main's) and `vitest.config.ts`'s coverage settings. Verify `git diff origin/main`
      shows neither file changed. Done

## 2. The check and CI (design D4)

- [x] 2.1 `scripts/check.py`: `--base`, the leg's variable and its refusals, complexity before `npm ci`, the audit on
      the leg, and no coverage; tests in `scripts/tests/test_check.py`. Verify they pass and a local check passes
- [x] 2.2 `ci.yml`: the `test` job sets `QUALITY_GATES_LEG` and passes each event's base. Verify the workflow's tests

## 3. Report and docs (design D3, D5)

- [x] 3.1 `.github/workflows/dependency-report.yml` with its board job. Verify by a test of its shape
- [x] 3.2 CONTRIBUTING / docs: the gates, where thresholds live, and that unit-testable logic belongs in `.ts`. Raise
      the follow-up issue for `.astro` coverage on the board. Verify the issue is on the board. Done: README.md (now
      saying website measures no coverage); troupe-run/website#133 is on the board, its future up to the owner

## Workflow follow-up

- Once troupe-run/infrastructure#332 is delivered (the module accepts a config without `[coverage]`), drop website's
  unread `[coverage]` table.

- Infrastructure's follow-up adds this repository's report to the schedule watch after its first run.
