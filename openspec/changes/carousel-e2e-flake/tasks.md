# Tasks

## 1. Freeze the clock

- [x] 1.1 Add `tests/e2e/clock.ts` with `freezeClock(page)`: `page.clock.install()`, then `pauseAt` a second later
  (design D1). Add `tests/e2e/clock.spec.ts`, which freezes the clock, loads `/`, reads `performance.now()` and
  `Date.now()` in the page, waits one second of real time and checks both read the same (design D3). Verify it
  passes, then verify it fails with `pauseAt` taken out of the helper, and put `pauseAt` back
- [x] 1.2 Replace every `page.clock.install()` in `tests/e2e/season-carousel.spec.ts` (21) and
  `tests/e2e/idle-bows.spec.ts` (5) with `await freezeClock(page)` at the same point. Verify `git diff` changes no
  test name and no assertion, and that `npm run test:e2e` passes in full. If a test fails with the clock frozen,
  stop and report which one and why rather than changing what it checks

## 2. Arm the carousel's timer at a known moment

- [x] 2.1 In `season-carousel.spec.ts`'s `open()`, after scrolling the carousel into view, wait for a fresh
  IntersectionObserver on the carousel to report it intersecting (design D2). Verify
  `npx playwright test tests/e2e/season-carousel.spec.ts --repeat-each 5` passes
- [x] 2.2 Add `tests/unit/e2e-clock.test.ts`, which fails, naming the file, when a file under `tests/e2e/` other than
  `clock.ts` calls `clock.install(` (design D3). Verify it passes, then add a `page.clock.install()` to a spec file,
  verify the test fails and names that file, and take it out again
- [x] 2.3 Show the race is gone (design D4), on throwaway copies of the files: in `season-carousel.spec.ts:197` add
  `await page.waitForTimeout(500)` before `toHaveCount(2)`; in `idle-bows.spec.ts:6` add
  `await page.waitForTimeout(1000)` and then a one-shot `expect(await bowing(page).count()).toBe(1)`. With main's
  versions (`git show main:<file>`), verify each fails in 5 of 5 runs (`--repeat-each 5`). With the fixed versions,
  verify each passes in 5 of 5. Delete the copies, verify `git status` shows none of them, and record the results.
  Recorded 2026-10-24: carousel, main fails 5/5, fixed passes 5/5; idle bow, main fails 5/5 (0 bowing), fixed
  passes 5/5. With a 1s delay before the unchanged assertions, the fixed versions also passed 5/5, and so did
  main's, by catching the next slide or bow (design D4)

## 3. Verify in the check

- [x] 3.1 Run `uv run scripts/check.py` and verify it passes, then run
  `npx playwright test --repeat-each 3` across both projects, the load the test failed under, and verify every test
  passes; record both outputs. Recorded 2026-10-24: `check: all gates passed` (e2e 28.8s); repeat-each 3:
  795 passed, none failed or flaky
- [x] 3.2 Open the pull request with `Closes #37` and verify CI's `test` job passes. Recorded 2026-10-24: PR #43; `test` passed (265 e2e passed, none retried)

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging; merge by rebase.
- After the merge, check #37 is closed and its card on the troupe roadmap board says Done; comment on #37 with the
  pull request and the archived change.
