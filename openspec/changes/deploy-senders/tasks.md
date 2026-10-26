# Tasks

## 1. Name both senders

- [x] 1.1 Rewrite the header comment of `.github/workflows/deploy.yml` so it names both senders: troupe-run/troupe's
  release workflow, on every push to troupe's `main`, and troupe-run/infrastructure's `milestones-notice` workflow,
  on a push to its `main` that changes `tofu/milestones.json` (spec: build-and-deploy). Keep its sentences on the
  dispatch taking no inputs and only `main` being built. Verify `git diff .github/workflows/deploy.yml` touches
  comment lines only, and that parsing the file before and after with `yaml` gives equal objects
- [x] 1.2 Update the header comment of `tests/unit/deploy-workflow.test.ts` to say the deploy starts on troupe's or
  infrastructure's notice, and that the token both use, the `troupe-run-docs` App's from
  troupe-run/infrastructure#110, can only dispatch it. Verify `git diff` touches that comment only, no test name or
  assertion, and that `npx vitest run tests/unit/deploy-workflow.test.ts` passes
- [x] 1.3 Check the delta spec's new requirement against infrastructure's side (design D2): read
  `.github/workflows/milestones-notice.yml` and the requirement "A change to the milestones rebuilds troupe.run" in
  `openspec/specs/milestones/spec.md`, on troupe-run/infrastructure's `main`, and verify the trigger (push to `main`,
  path `tofu/milestones.json`), the `docs` environment, no checkout and the `troupe-run-docs` App's token all match.
  Record the commit read. If any differ, stop and report it rather than editing the spec to match. Recorded
  2026-10-26, infrastructure `main` at e45f7edb637e: all match (`on.push` to `main`, `paths: [tofu/milestones.json]`;
  `environment: docs`; no `actions/checkout`, `permissions: {}`; token minted from `DOCS_APP_*`, the `troupe-run-docs`
  App per `docs-build-credentials`; `gh workflow run deploy.yml -R troupe-run/website --ref main` with no inputs)
- [x] 1.4 Verify `openspec validate deploy-senders --strict` passes

## 2. Verify in the check

- [x] 2.1 Run `uv run scripts/check.py` and verify it passes; record the output. Recorded 2026-10-26, rebased on
  main at 5d876c7 (which carries infrastructure#155's `guard.yml`): `check: all gates passed` (e2e 265 passed)
- [x] 2.2 Open the pull request with `Closes #47` and verify CI's `test` job passes. Recorded 2026-10-26: PR #50;
  `test` passed (2m7s), `guard` passed

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging, so `openspec/specs/build-and-deploy/spec.md` takes the delta;
  merge by rebase.
- After the merge, check #47 is closed and its card on the troupe roadmap board says Done; comment on #47 with the
  pull request and the archived change.
