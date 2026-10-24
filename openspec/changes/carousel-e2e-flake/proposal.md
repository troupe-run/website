# Proposal

## Why

`tests/e2e/season-carousel.spec.ts:197` failed once in a full `uv run scripts/check.py` run on 2026-10-24, on a
branch that doesn't touch the carousel (#37). It passed 15 times out of 15 run alone. The check gates every commit,
so a test that fails at random blocks work that has nothing to do with it, and teaches people to re-run until green.

The cause is in how the test drives time, not in the carousel. `page.clock.install()` fakes `setTimeout`,
`requestAnimationFrame` and `performance.now()`, but it doesn't stop the clock: fake time keeps flowing at wall-clock
speed until `pauseAt` is called (Playwright 1.63's own docs for `clock.pauseAt`). The test never pauses it. So after
`runFor(6000 + 250)` puts the slide 250ms into its 500ms move, the move goes on finishing in real time while
`toHaveCount(2)` polls. Two cards are on stage for only about 250ms of real time. On a machine busy running both
builds' projects in parallel, the first poll can come after that, and the assertion then waits 5s for a state that
never comes back. The failed run's 5.7s fits that.

The same flaw is in every e2e test that calls `clock.install()`: 21 in `season-carousel.spec.ts` and 5 in
`idle-bows.spec.ts`. The ones that sample a short-lived moment can lose the same race: the carousel's slide offsets,
tab indicator, wrap ghost and dial angle mid-transition, and a character's 700ms bow ("after 5s … exactly one
character is bowing", and the bow at 9.1s). The others pass only because nothing they check changes during the drift.
`idle-bows.spec.ts:52` already works round it in one place, with a one-shot count instead of a retrying assertion.

A second race sits under it. The carousel arms its timer when its IntersectionObserver says it's on screen. The test
scrolls it into view and calls `runFor` straight away, without waiting for the observer to report. When the
observer is late, the timer is armed later than the test assumes, or not at all before `runFor` runs.

## What Changes

- Every e2e test that controls time freezes the clock before the page loads, so fake time moves only when the test
  calls `runFor`. A state the test samples at "+250ms" stays at +250ms until the test moves on, however slow the
  machine.
- The carousel's clock tests wait until the carousel has been told it's on screen before they advance time, so its
  timer is armed at a known moment. The idle-bow tests already wait for the cast's `data-idle` state.
- The freezing is one shared helper, and a unit test fails if an e2e test installs the clock without it, so a new
  test can't bring the race back.
- No assertion is loosened and no test name changes. Each test checks what it checked before, at the same moments.
- The fix is shown to work by adding a real one-second delay between advancing time and asserting: with the delay,
  the test at `season-carousel.spec.ts:197` and the idle-bow test at `idle-bows.spec.ts:6` fail every time on
  main's version of the files, and pass on the fixed ones.
- The site's code (`src/components/sections/HowItWorks.astro`, `src/scripts/season-carousel.ts`, the cast's idle
  script) doesn't change, and gains no test-only hooks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-check`: a new requirement that end-to-end tests which control time don't depend on wall-clock speed, so
  the check's e2e gate doesn't fail at random under load.

## Impact

- `tests/e2e/season-carousel.spec.ts`, `tests/e2e/idle-bows.spec.ts`, a new shared helper beside `tests/e2e/fixtures.ts`,
  and a new unit test under `tests/unit/`. No page, script, config, copy or Playwright setting changes.
- CI's `retries: 1` stays. It hides a flake in CI but not in the guard's local check, which has no retries; this
  change removes the flake rather than leaning on retries.
- No other e2e test uses `page.clock`.
