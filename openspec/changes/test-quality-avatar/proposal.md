# Proposal

## Why

troupe-run has a new GitHub App, `troupe-run-test-quality` (App ID 5807252, created by the owner on 2026-11-18). It
runs mutation testing weekly and raises or updates an issue for each under-tested module
(troupe-run/infrastructure#325). It shows GitHub's default icon, so its issues don't look like troupe's. This is
troupe-run/website#128.

## What Changes

- **Its character is the owner's choice of 2026-11-18** (#128): a **bug-like head in `--teal`** (`#14857D`), with
  two round white eyes, holding **a magnifying glass only** in `--ink` line on the `--sunflower` badge, ringed by
  cream over the head's lower right, as the other seven are. A bug inside the badge too was ruled out as unreadable
  at small sizes.
- **It's a deliberate exception to "the shape follows what the App is".** The App runs a fixed workflow, so its kind
  is `system`, which would make it the tomato triangle. The bug says what it hunts for. The brand guide records the
  exception and why, so teal still means "agent" everywhere else: the bug is the only teal head that isn't an agent,
  and its shape isn't the agent's square, so the two never read alike.
- **The guide's App table says each App's head**, as a new column (`triangle`, `square` or `bug`), next to its kind.
  The check reads the head's colour from it and refuses a head on a kind it isn't for (a square on a `system` App,
  a triangle on an agent). Today the kind alone sets the colour, so a teal `system` App would fail the check.
- **The avatar is made as the others are**: `brand/apps/troupe-run-test-quality.svg` on the same 100×100 geometry
  (the badge at 69,69, the same prop scale and stroke), rendered by `brand/templates/app-avatar.html` to
  `brand/out/app-troupe-run-test-quality.png` at 500×500, and committed.
- **The owner reviews it at 500px and 40px before the pull request is ready**, and it's redrawn until it reads as a
  bug with a magnifier at 40px.
- **The owner uploads the PNG as the App's logo** (the App's settings, Display information). It's the last step, and
  it's owner-only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-avatars`: the guide's table gains a head for each App and lists `troupe-run-test-quality`; a source's head
  colour follows its head, which is fixed by its kind except for the one recorded exception, the teal bug on a
  `system` App.

## Impact

- New: `brand/apps/troupe-run-test-quality.svg`, `brand/out/app-troupe-run-test-quality.png`.
- Changed: `docs/brand-guide.md` §5 "GitHub Apps" (the exception, the Head column, the new row), `scripts/app-avatars-lib.mjs`
  and `tests/unit/app-avatars.test.ts` (the head column), `scripts/assets.config.mjs` (`APPS`), and
  `brand/out/manifest.json` (re-rendered).
- The other seven avatars don't change. No site page, copy, token, workflow or guard file changes.
- Outside this repository: the owner sets the App's logo on GitHub by hand.
