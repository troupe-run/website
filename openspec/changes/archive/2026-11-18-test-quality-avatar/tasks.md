# Tasks

## 1. The check reads each App's head (design D1)

- [x] 1.1 In `tests/unit/app-avatars.test.ts`, first change the fixture table to `App | Kind | Head | Prop` and add
  fixture tests: a row reads as `{ app, kind, head, prop }`; an unknown head fails naming the App, the head and the
  heads the check knows; a `square` on a `system` App and a `triangle` or `bug` on an agent each fail naming the App,
  its kind and its head; a teal bug source passes for a `bug` App; teal in a `triangle` source and tomato in a `bug`
  source each fail naming the colour. Add `troupe-run-test-quality` to the real-guide list. Run
  `npx vitest run tests/unit/app-avatars.test.ts` and see the new tests fail.
- [x] 1.2 Change `scripts/app-avatars-lib.mjs`: read the Head column, refuse an unknown head or a head on a kind it
  isn't for, and check each source against its head's colour. Verify the fixture tests from 1.1 pass (the real-file
  tests stay failing until groups 2 and 3).

## 2. The guide records the exception (design D1)

- [x] 2.1 In `docs/brand-guide.md` §5 "GitHub Apps", add the exception (the teal bug for `troupe-run-test-quality`, a
  `system` App, and why: the bug says what it hunts for, and teal still means an agent everywhere else, the bug being
  the only teal head that isn't one), add the Head column to the table, and add the row
  `troupe-run-test-quality | system | bug | a magnifying glass`. Verify the real-guide tests read eight Apps and their
  heads, and that §8's App avatars row still covers the new PNG.

## 3. The avatar (design D2, D3)

- [x] 3.1 Add `troupe-run-test-quality` to `APPS` in `scripts/assets.config.mjs`, and draw
  `brand/apps/troupe-run-test-quality.svg` with its comment line in the others' form: the teal bug head with two white
  eyes, the cream ring and sunflower disc at 69,69, and the magnifier on the 24-unit grid at
  `translate(54 54) scale(1.25)`, `stroke-width` 2.88. Verify `npx vitest run tests/unit/app-avatars.test.ts` passes,
  including the real-file tests.
- [x] 3.2 Run `npm run assets:render`. Verify `npm run assets:verify` passes, the new PNG is 500×500, and the only
  changed outputs are the new PNG and the manifest (`git status`; the other seven PNGs unchanged).

## 4. The owner's visual review (spec, "The avatars read at GitHub's sizes"; design D4)

- [x] 4.1 Build a contact sheet in the scratchpad (not committed): the new avatar at 500, 40 and 20px on light and
  dark, beside `troupe-run-review`. Send the PNG at full size and at 40px, and the sheet, to the owner through the
  orchestrator. Redraw (repeat 3.1 and 3.2) until the owner agrees the bug head and the magnifier read at 40px.
  Verified by the owner's reply, recorded here with its date. **Owner, 2026-11-18: approved the committed drawing
  (variant B: curved antennae with round tips, bent legs) over a straight-legged one, which read as a germ, and one
  with a separate head segment.**

## 5. Before merging

- [x] 5.1 Run `uv run scripts/check.py`, and verify it passes.

## Workflow follow-up

- Archive the change on the branch before merging (`/openspec-archive-change`).
- After the merge, the owner uploads `brand/out/app-troupe-run-test-quality.png` as the App's logo (App settings,
  Display information), and #128 gets a comment naming the PR and the archived change.
