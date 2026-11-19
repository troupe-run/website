# Tasks

## 1. The guide and the check's lists

- [ ] 1.1 In `tests/unit/app-avatars.test.ts`, add `troupe-run-merge` to the real-guide list. Run
  `npx vitest run tests/unit/app-avatars.test.ts` and see the real-guide test fail (the guide doesn't list it yet).
- [ ] 1.2 In `docs/brand-guide.md` §5 "GitHub Apps", add the row `troupe-run-merge | system | triangle | a merge symbol`.
  Verify the real-guide list test passes and the source/render tests now fail naming `troupe-run-merge` as missing.

## 2. The avatar (design D1)

- [ ] 2.1 Add `troupe-run-merge` to `APPS` in `scripts/assets.config.mjs`, and draw `brand/apps/troupe-run-merge.svg`
  with its comment line in the others' form: the triangle head as in `troupe-run-dispatch.svg`, the cream ring and
  sunflower disc at 69,69, and the merge symbol on the 24-unit grid at `translate(54 54) scale(1.25)`,
  `stroke-width` 2.88. Verify `npx vitest run tests/unit/app-avatars.test.ts` passes.
- [ ] 2.2 Run `npm run assets:render`. Verify `npm run assets:verify` passes, the new PNG is 500×500, and the only
  changed outputs are the new PNG and the manifest (`git status`; the other eight PNGs unchanged).

## 3. The owner's visual review (spec, "The avatars read at GitHub's sizes"; design D2)

- [ ] 3.1 Build a contact sheet in the scratchpad (not committed): the new avatar at 500, 40 and 20px on light and
  dark, beside `troupe-run-dependabot` and `troupe-run-dispatch`, with the fallback symbols from D1. Send the PNG path
  and the sheet to the owner through the orchestrator. Redraw (repeat 2.1 and 2.2) until the owner agrees the merge
  symbol reads at 40px. Verified by the owner's reply, recorded here with its date.

## 4. Before merging

- [ ] 4.1 With the orchestrator's go-ahead, run `uv run scripts/check.py`, and verify it passes.

## Workflow follow-up

- Archive the change on the branch before merging (`/openspec-archive-change`).
- After the merge, the owner uploads `brand/out/app-troupe-run-merge.png` as the App's logo (App settings, Display
  information), and #151 gets a comment naming the PR and the archived change.
