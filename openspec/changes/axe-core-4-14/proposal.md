# Proposal

## Why

Dependabot's #58 moves `@axe-core/playwright` from 4.13.0 to 4.14.0 (troupe-run/website#67), and its `test` job
fails. axe-core 4.14 turns on `label-content-name-mismatch` (WCAG 2.5.3, Label in Name) by default; until now it was
experimental and didn't run. That rule now reports one node, on every page with a search box: Starlight's header
search button, at desktop width. Its accessible name is "Search", and its visible text is "Search" plus the
shortcut hint (`Ctrl` `K`, or `⌘` `K` on a Mac). CI run 40815717343 shows that node and nothing else, 20 times over.

Starlight closed this as not planned (withastro/starlight#4260, 2026-10-11). Its maintainer reads the hint as
supplementary rather than part of the label. The hint is exposed through `aria-keyshortcuts`, and WCAG's
Understanding document for 2.5.3 says symbolic text isn't a visible label. The ACT rule and WCAG discussions
(act-rules#2040, w3c/wcag#3186) are still open. The obvious markup fixes either still fail, because of an axe bug
(dequelabs/axe-core#5458) in how it joins visible text, or make screen readers hear the shortcut twice.

The rule is worth having for every other control on the site, so we take the update rather than hold it. That leaves
the search button needing a decision, and the owner chose (2026-10-29) a narrow, checked exception over overriding
Starlight's component or staying on 4.13.

## What Changes

- `@axe-core/playwright` goes from 4.13.0 to 4.14.0 in `package.json` (still an exact pin), and `package-lock.json`
  moves it and `axe-core` to 4.14.0 and nothing else.
- The axe checks get one shared helper, used by `tests/e2e/a11y.spec.ts` and the version-menu axe tests in
  `tests/e2e/versions.spec.ts`. It runs axe with the same WCAG 2.2 AA tags as now, and it holds the site's list of
  accepted axe findings. Each entry names one rule on one node and says why.
- The list has one entry: `label-content-name-mismatch` on `button[data-open-modal=""]`, citing Starlight #4260.
  Every other rule still checks that button. Any other node that breaks this rule still fails, and so does any
  serious or critical violation not on the list.
- A test checks the reason the exception was accepted. On a docs page at desktop width, the button's accessible name
  must be exactly "Search", its visible text with the shortcut hint removed must be "Search", and it must have
  `aria-keyshortcuts`. If Starlight changes the button so that this stops being true, that test fails, rather than
  the exception quietly covering a real mismatch.
- The same test fails when axe no longer reports the excepted node, so the exception is removed once Starlight or axe
  makes it unnecessary.
- After the merge, Dependabot closes #58 as up to date, following the development workflow's route for an update that
  can't merge as it is.

## Capabilities

### New Capabilities

- `accessibility`: the site's automated accessibility gate. axe runs on the listed pages in light and dark against
  the WCAG 2.2 AA rule tags, reports no serious or critical violation, and any accepted finding is narrow, has a
  stated reason and is checked. No spec held this until now; the axe tests existed with nothing describing them.

### Modified Capabilities

None. `quality-check` runs the end-to-end tests, but what they check isn't its business, and its requirements don't
change.

## Impact

- Files: `package.json`, `package-lock.json`, `tests/e2e/a11y.spec.ts`, `tests/e2e/versions.spec.ts`, a new
  `tests/e2e/axe.ts` beside `clock.ts` and `port.ts`, and a new `tests/unit/e2e-axe.test.ts`.
- No page, component, style or copy changes. Starlight's `Search` component isn't overridden, so this adds no
  Starlight override.
- The rule's other findings now fail CI on any page the axe tests visit. Today there are none.
- At widths below Starlight's `md` breakpoint the hint is hidden and the rule doesn't fire. The axe tests run at
  Playwright's default desktop viewport, which is where it does.
- Out of scope: changing the search button's markup, reporting further upstream, and the other open Dependabot
  issues.
