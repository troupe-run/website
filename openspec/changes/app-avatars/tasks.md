# Tasks

## 1. The guide records the Apps (design D1, D3)

- [x] 1.1 Add a "GitHub Apps" subsection to the brand guide's §5: the shape rule (fixed-workflow Apps are troupe acting
  by itself, the `system` kind, so they're the tomato triangle; an App that is an AI acting as an agent is the teal
  square), that the avatar is a head and a prop with no reflection, that each avatar is its own image and not a scene
  (so the once-per-scene rule for the triangle doesn't apply across avatars), that `dco` keeps its own icon, that the
  list follows troupe-run/infrastructure's `oob/app-installations.json`, and a table with one row per App: App, kind
  (`system` or agent), prop. Add a §8 row for the App avatars (PNG 500×500, one per App, in `brand/out/app-<app>.png`).
  Verify by reading the rendered guide, then checking the table against design D3 and against the seven non-`dco`
  slugs in infrastructure's file (`gh api repos/troupe-run/infrastructure/contents/oob/app-installations.json`).

## 2. The check (design D5)

- [x] 2.1 Write `tests/unit/app-avatars.test.ts` first. Run it against fixtures for every failure in the spec: a guide
  App with no source, a guide App with no `APPS` entry, a source or `APPS` entry the guide doesn't list, a `system`
  source with teal, an agent source with tomato, a colour outside the palette, a gradient, a filter or opacity, a
  stroke that differs from its own fill, and an `rgb()`, named or `style` colour. Each one names the App or source
  and the value, as its scenario says. Also run it against the real guide, `APPS` and `brand/apps/`. Name each test
  for what its body checks. Verify they all fail before `scripts/app-avatars-lib.mjs` exists.
- [x] 2.2 Add `scripts/app-avatars-lib.mjs` (it reads §5's App table and checks one SVG against its kind's palette) and
  verify the fixture tests in 2.1 pass. The real-file tests stay failing until group 3.

## 3. Sources and the pipeline (design D2, D4)

- [x] 3.1 Add `brand/templates/app-avatar.html`, which puts `../apps/<app>.svg` from `?app=` on the cream page at full
  size and draws nothing itself. Add the `APPS` list to `scripts/assets.config.mjs`, mapped to `ASSETS` entries
  (`brand/out/app-<app>.png`, 500×500) and to `SOURCES`. Verify `node -e` prints seven new `ASSETS` entries and their
  sources.
- [x] 3.2 Draw the seven `brand/apps/<app>.svg` on a 100×100 viewBox: the head from the favicon's triangle or the
  mark's square geometry, with eyes, and the D3 prop overlapping the lower right, all inside the inscribed circle.
  Verify `npm test` passes, including 2.1's real-file tests.
- [x] 3.3 Run `npm run assets:render`, and verify `npm run assets:verify` passes, the seven PNGs are 500×500, and the
  only outputs that changed are the seven new ones and the manifest (`git status`). Then confirm verification
  falsifies drift: edit one App source without re-rendering, see `assets:verify` fail naming it, and revert.

## 4. The owner's visual review (spec, "The avatars read at GitHub's sizes")

- [ ] 4.1 Build a contact sheet in the scratchpad, not committed: each avatar at 20, 40 and 500px, on GitHub's light
  and dark backgrounds, next to the org avatar. Screenshot it and show the owner. Redraw any prop the owner rejects
  (repeat 3.2 and 3.3) until the owner agrees that each avatar reads as its kind at 20px and shows its prop at 40px.
  This can't be automated: the owner verifies it by eye. Record the owner's agreement in the pull request.

## 5. Integration

- [ ] 5.1 Run `uv run scripts/check.py` and verify it passes, then commit with Conventional Commits and no sign-off.

## Workflow follow-up

- Open the draft pull request with `Closes #81`, act on Claude's review, mark it ready, archive on the branch, and ask
  the owner to merge.
- After the merge, the owner uploads each `brand/out/app-<app>.png` as that App's logo on GitHub (owner-only, no API).
  Comment on #81 with the pull request and the archived change, and check that #81 is closed and its board card is
  Done. #81's last "Done when" item is the upload, so if the PR closes the issue before the owner has uploaded the
  logos, say so in that comment.
