import type { Page } from '@playwright/test';

// The only way an e2e test fakes the page's clock (carousel-e2e-flake design D1). clock.install() alone fakes the
// timers but lets fake time run at real speed, so a state sampled mid-animation drifts away while a slow machine
// gets round to asserting it. Paused before navigation, the page's timers are all armed at one fake moment and time
// moves only when the test calls runFor. tests/unit/e2e-clock.test.ts fails if a test installs the clock elsewhere.
export async function freezeClock(page: Page) {
  await page.clock.install();
  await page.clock.pauseAt(Date.now() + 1000);
}
