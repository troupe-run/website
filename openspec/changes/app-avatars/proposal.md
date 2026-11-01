# Proposal

## Why

The seven GitHub Apps that act for troupe-run show GitHub's default App icons. So a release pull request, a review
conversation or a commit of org state doesn't look like troupe's, and nothing in the picture says which job the App
does. This is troupe-run/website#81.

## What Changes

- **The Apps get a character, decided with the owner on 2026-11-01** (#81's first design question):
  - The six Apps that run fixed workflows are **troupe acting by itself**, the glossary's `system` actor kind. Each
    is the **tomato rounded triangle with eyes**, holding a prop for its job.
  - `troupe-run-review` is Claude's review, an AI acting as an agent. It's the **teal rounded square with eyes**,
    holding a tick.
  - No new shape, colour or actor kind is added. Each shape keeps the meaning the brand guide gives it.
- **One avatar per App, each with its own prop** in `--ink` or `--sunflower`, as the brand guide's §5 says. The
  props are listed in the design (D3), and the owner reviews them as images before they're called done:

  | App | Character | Prop |
  |---|---|---|
  | `troupe-run-release` | triangle | a tag |
  | `troupe-run-review` | square | a tick |
  | `troupe-run-dependabot` | triangle | a chain link |
  | `troupe-run-infrastructure` | triangle | a spanner |
  | `troupe-run-docs` | triangle | a book |
  | `troupe-run-dispatch` | triangle | a paper plane |
  | `troupe-run-board` | triangle | a clipboard |

- **They're made by the existing brand pipeline.** Each App has a source SVG in `brand/apps/`, and one template,
  `brand/templates/app-avatar.html`, renders each one to `brand/out/app-<app>.png` at 500×500, as the org avatar is.
  The renders are committed, and asset verification fails when a source changes but its render isn't redone.
- **The brand guide records them.** §5 gets a subsection on the GitHub Apps, with the shape rule and a table of each
  App's character and prop. §8's asset table gets a row for the App avatars.
- **A check holds the guide, the sources and the renders together.** Every App in the guide's table has a source
  and a rendered avatar, and nothing else does. Each source uses only its kind's colours: tomato or teal for the
  head, white for the eyes, and ink or sunflower for the prop.
- **The owner sets each App's logo on GitHub by hand.** Each App's settings page takes the image, and there's no
  API for it. It's the last step, and it's owner-only.

`dco` is a third-party App and keeps its own icon.

## Capabilities

### New Capabilities

- `app-avatars`: the GitHub Apps' characters as the brand guide records them. One rendered avatar for each App,
  from a source in `brand/`, in that App's kind's shape and colours, checked against the guide.

### Modified Capabilities

None. Asset verification (the `quality-check` spec's brand-asset step) already covers any image in the asset
config. Adding entries doesn't change what it requires.

## Impact

- New: `brand/apps/*.svg` (seven), `brand/templates/app-avatar.html`, `brand/out/app-*.png` (seven), and a unit
  test for the guide, the sources and the config agreeing.
- Changed: `scripts/assets.config.mjs` (seven render entries, and the sources it hashes), `brand/out/manifest.json`
  (re-rendered), and `docs/brand-guide.md` §5 and §8.
- No site page, copy, style token, workflow or guard file changes. The avatars aren't served on troupe.run.
- Outside this repository: the owner uploads each image in the App's GitHub settings. The App list comes from
  troupe-run/infrastructure's `oob/app-installations.json`. If an App is added there later, it needs a guide row and
  an avatar here. Nothing links the two automatically (design, D5).
