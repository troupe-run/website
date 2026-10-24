# Design

## Context

See proposal.md (Why) for the cause. What shapes the fix:

- Playwright 1.63's `clock.install()` replaces `Date`, `setTimeout`, `requestAnimationFrame` and `performance` in the
  page, and then lets fake time run at real speed. Only `pauseAt` stops it. After that, timers and animation frames
  fire only inside `runFor`, `fastForward`, `pauseAt` or `resume`.
- The carousel's slide, indicator and dial motion is driven by `requestAnimationFrame` and `performance.now()`
  (`HowItWorks.astro`, `show()`). It has no CSS transitions on the slides, so a frozen clock freezes the whole move.
  The tabs' 500ms colour transition is CSS, but no test samples it mid-way.
- The carousel's auto-advance timer is armed by `createSeasonCarousel` at creation, cleared when its
  IntersectionObserver reports it off screen, and armed again when the observer reports it on screen. When the page
  loads with the carousel below the fold, the timer that counts is the one armed after `open()` scrolls it into
  view. Either way, the test can't tell from outside when that happened.
- The cast's idle bows (`idle-bows.spec.ts`) use timers too, and the page reports their state in `data-idle`, which
  the tests already wait for.
- `playwright.config.ts` runs fully parallel, with the `chromium` and `versions` projects against two preview
  servers. That's the load under which the test failed. The guard's local check has no retries; CI has one.

## Goals / Non-Goals

**Goals:**

- Every e2e test that fakes the clock samples exactly the fake moment it names, whatever the machine's speed.
- The race can't come back unnoticed when someone adds a clock test.

**Non-Goals:**

- Changing what any test checks, or its name. If a test turns out to fail with the clock frozen, that's a finding
  to report, not something to adjust the assertion for.
- Changing the carousel or the cast, or adding test-only attributes to them.
- Changing `retries`, parallelism or timeouts in `playwright.config.ts`.

## Decisions

### D1. Freeze the clock before navigation, in one helper

A helper, `freezeClock(page)` in a new `tests/e2e/clock.ts`, calls `page.clock.install()` and then
`page.clock.pauseAt()` at a time a second after the install's start, before `page.goto`. From then on the page sees
the same `Date.now()` and `performance.now()` until the test calls `runFor`. Every test that called
`page.clock.install()` calls `freezeClock(page)` in its place, at the same point (before `emulateMedia` and `goto`,
as now).

Why before navigation: every timer the page arms while loading is then armed at the same fake time, so "6000 + 250"
means 250ms into the first slide however long the load took. Pausing after load would leave the arming time to
however long the load took in real time, and `pauseAt` to a later time would fire the timers that came due on the
way.

Playwright's docs suggest letting the page load with time running, because a page can stall if it waits on a timer
to finish loading. The landing page doesn't: its `load` event doesn't wait for any timer, and its scripts only arm
timers for motion. A throwaway spike on 2026-10-24 (5 runs of each case, then deleted) confirmed it: with the clock
frozen before `goto`, the page loaded, the carousel got `data-enhanced`, the cast reached `data-idle="running"`, and
`performance.now()` and `Date.now()` read the same before and after a second of real time. Task 1.2 still runs the
whole suite with the frozen clock, since the spike covered only the landing page's carousel and cast.

Alternatives considered:

- *Keep the clock running and widen the windows* (sample earlier, longer transitions in tests). Still a race, only a
  rarer one, and it changes what the tests check.
- *One-shot reads instead of retrying assertions*, as `idle-bows.spec.ts:52` does. That narrows the window to a
  single round trip but doesn't close it, and every new test would have to know to do it.
- *Rely on retries.* The guard's local check has none, and a retry that passes hides a real failure as easily as a
  flake.

### D2. Wait for the carousel's IntersectionObserver before advancing time

`open(page)` in `season-carousel.spec.ts`, after scrolling the carousel into view, waits for a fresh
IntersectionObserver on the same element to report it intersecting. The HTML spec runs every observer of a document
in one task, in the order the observers were created, so by the time the test's observer reports, the carousel's own
observer (created when the page's script ran) has been given the same state. The carousel has then armed its timer
at the frozen time.

This is the existing `open()` and runs in every carousel test, clock or not. It adds no waiting where the observer
has already reported.

IntersectionObserver isn't one of the APIs the clock fakes, and it's delivered by the browser's own rendering, so it
reports while the clock is frozen. The spike confirmed it: the fresh observer reported, and 250ms into the slide two
cards were on stage after a second of real time, then one after `runFor(400)`, in 5 of 5 runs. In the spike the
carousel's timer was armed in time even without the wait (5 of 5, run alone), so this wait closes a race that's
possible rather than one seen. It's kept because it costs nothing once the observer has reported.

Alternatives considered:

- *Wait for `aria-live="off"`.* The live region reads `off` whenever the carousel is rotating, including the moment
  before the observer's first report, so it can't tell "armed after scrolling" from "not told yet".
- *A `data-` attribute on the carousel saying it's on screen.* It would work, but it's a hook in the page for the
  tests' sake, which the proposal rules out when the browser already gives a sound signal.

### D3. A unit test keeps every clock install going through the helper

`tests/unit/e2e-clock.test.ts` reads every file under `tests/e2e/` and fails, naming the file, when one calls
`clock.install(` and isn't `tests/e2e/clock.ts`. It's a text check. It can be
fooled on purpose (an alias for `page.clock`), but it catches the ordinary way the race would come back: a new test
copied from an old pattern.

An e2e test of the helper itself, in `tests/e2e/clock.spec.ts`, freezes the clock, loads `/`, reads
`performance.now()` and `Date.now()` in the page, waits one second of real time, and reads them again. It fails if
the helper stops freezing the clock (for instance, if `pauseAt` is dropped). That's the property the spec states,
checked directly rather than through a test that happens to sample at the right moment.

### D4. Show the fix against main with an injected delay

The proof the flake is gone can't be "it passed N times", since the old test passes nearly every time too. Instead,
task 2.3 adds `await page.waitForTimeout(…)`, real time on the test's side, after `runFor` and before the state the
test names is read. The delay stands in for a slow machine. With main's versions, the read is wrong every time; with
the fixed ones, right every time. The delay isn't committed. The permanent guard against regression is D3.

The delay has to fit each test's timing, because on main the clock keeps running while a retrying assertion polls
for its 5s timeout, and the poll can catch the *next* event instead (found applying the change: a 1s delay let
main's versions of both tests pass, 5 of 5):

- **Carousel, `season-carousel.spec.ts:197`: a 500ms delay.** The poll starts at 6.75s, after the 6.0–6.5s slide,
  and ends at 11.75s, before the next one at 12s. With a 1s delay, the poll reaches the 12s slide and passes.
- **Idle bow, `idle-bows.spec.ts:6`: a 1s delay, then a one-shot read.** A bow lasts 700ms every 5s, so the 5s poll
  always reaches the next bow and no delay can make main's retrying assertion fail. A one-shot read at the named
  moment, as `idle-bows.spec.ts:52` already does, shows the state the test names has gone.

## Risks / Trade-offs

- [A test needs time to run during load] With the clock frozen before `goto`, anything on the page that waits on a
  fake timer to settle doesn't. → The spike found nothing of the kind on the landing page; task 1.2 runs the whole suite; if one fails, the finding is reported and that
  test's own wait is fixed, not the freeze dropped.
- [The observer ordering] D2 relies on the HTML spec's order for delivering IntersectionObserver callbacks. →
  Chromium follows it. If it ever didn't, the carousel tests would fail by finding no transition, which shows up as
  a failure, not a silent pass.
- [The text check in D3 is easy to fool] → It's aimed at accidents, not at someone working round it, and the helper's
  own e2e test checks the freeze holds.

## Migration Plan

None. Test-only change; nothing deploys differently.
