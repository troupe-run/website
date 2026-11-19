# Proposal

## Why

troupe-run has a new GitHub App, `troupe-run-merge` (App ID 5832075). It queues pull requests that pass the safe-PR
rule (troupe-run/infrastructure#320). It shows GitHub's default icon, so what it does on a pull request doesn't look
like troupe's. This is troupe-run/website#151.

## What Changes

- **Its character is the owner's choice of 2026-11-20** (#151): the system **triangle** head in `--tomato`, as for
  the other infrastructure Apps, with two round white eyes, holding a **merge symbol** (two lines joining into one; the owner picked the sideways form from three drawn options)
  in `--ink` line on the `--sunflower` badge, ringed by cream over the head's lower right, as the other eight are.
  It runs a fixed workflow, so its kind is `system`, and the triangle follows from the shape rule with no exception.
- **The guide's App table gains a row**: `troupe-run-merge | system | triangle | a merge symbol`.
- **The avatar is made as the others are**: `brand/apps/troupe-run-merge.svg` on the same 100×100 geometry (the
  triangle at `translate(1 0) scale(2.05)`, the badge at 69,69, the prop on the 24-unit grid at
  `translate(54 54) scale(1.25)`, `stroke-width` 2.88), rendered by `brand/templates/app-avatar.html` to
  `brand/out/app-troupe-run-merge.png` at 500×500, and committed.
- **The owner reviews it at 500, 40 and 20px before the pull request is ready**, and it's redrawn until the merge
  symbol reads at 40px and doesn't read as `troupe-run-dependabot`'s pull request or `troupe-run-dispatch`'s chevrons.
- **The owner uploads the PNG as the App's logo** (the App's settings, Display information). It's the last step, and
  it's owner-only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-avatars`: the guide lists `troupe-run-merge` among the Apps with an avatar.

## Impact

- New: `brand/apps/troupe-run-merge.svg`, `brand/out/app-troupe-run-merge.png`.
- Changed: `docs/brand-guide.md` §5 "GitHub Apps" (the new row), `scripts/assets.config.mjs` (`APPS`),
  `tests/unit/app-avatars.test.ts` (the real-guide list), `brand/out/manifest.json` (re-rendered).
- The check (`scripts/app-avatars-lib.mjs`) doesn't change: a `system` App with the `triangle` head is the ordinary
  case. The other eight avatars don't change. No site page, copy, token, workflow or guard file changes.
- Outside this repository: the owner sets the App's logo on GitHub by hand.
