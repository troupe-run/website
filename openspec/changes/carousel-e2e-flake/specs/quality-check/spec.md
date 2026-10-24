# Spec Delta

## ADDED Requirements

### Requirement: End-to-end tests that control time don't depend on wall-clock speed
An end-to-end test that fakes the page's clock SHALL freeze it before the page loads, so fake time moves only when the
test advances it. Before advancing time, the test SHALL wait for whatever arms the timers it relies on, such as the
carousel being told it's on screen. A state the test samples SHALL stay as sampled however long the machine takes to
make the assertion.

#### Scenario: A slow machine between advancing time and asserting
- **WHEN** a real one-second delay is added between the carousel test advancing time to 250ms into a slide and
  checking that two cards are on stage
- **THEN** the test still passes, every time

#### Scenario: A short-lived state sampled late
- **WHEN** a real one-second delay is added between the idle-bow test advancing time to 5.1s and checking that one
  character is bowing
- **THEN** the test still passes, every time

#### Scenario: The frozen clock stands still
- **WHEN** a test freezes the clock, loads the landing page and waits one second of real time
- **THEN** `performance.now()` and `Date.now()` in the page read the same as before the wait

#### Scenario: A test that installs the clock some other way
- **WHEN** a file under `tests/e2e/` calls `clock.install` without going through the shared helper that freezes it
- **THEN** the unit tests fail and name that file
