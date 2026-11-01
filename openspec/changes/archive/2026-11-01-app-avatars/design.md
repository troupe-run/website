# Design

## Context

See proposal.md for why. What's here now:

- `brand/favicon.svg` is the triangle with eyes, and `brand/mark.svg` has all three heads. The square's corner radius
  is 0.28h and the triangle is a stroked path with round joins (brand guide §2).
- `brand/templates/github-avatar.html` renders the org avatar: `favicon.svg` at 360px on a 500×500 cream page.
- `scripts/assets.config.mjs` lists every render (`ASSETS`) and the files it hashes (`SOURCES`).
  `npm run assets:render` writes the PNGs and `brand/out/manifest.json`. `npm run assets:verify`, which is part of
  `scripts/check.py`, fails if a source or an output has changed since the manifest was written, or if an output is
  the wrong size.
- The guide's §5 says props are "simple shapes in `--ink` or `--sunflower`". Its §2 says to use the triangle alone
  below 24px. That's a rule for the mark, but the reason (detail is lost) applies here too.
- GitHub serves an App's avatar as one image, scaled: about 20px beside an inline event or a commit, 40px beside a
  comment, and up to 500px on the App's page. There's no way to give it a separate small version.

## Goals / Non-Goals

**Goals:**
- Seven avatars, made the same way as the org avatar, so asset verification covers them with no new mechanism.
- One place, the brand guide's table, that says which Apps there are and what each one looks like. A check holds the
  sources and the config to it.

**Non-Goals:**
- Serving the avatars on troupe.run, or putting the Apps on any page.
- Bodies, reflections or scenes. An avatar is a head and a prop.
- Following infrastructure's App list automatically (D5).
- Re-drawing the org avatar or the mark.

## Decisions

### D1. Kind: `system` triangles, and an agent square for the review (owner, 2026-11-01)

Six Apps run fixed workflows on the org's behalf. That's troupe acting by itself, which the glossary already names
(`system`), and the triangle is the shape for it. `troupe-run-review` runs Claude, which is an agent, so it's the
square.

Considered:
- **All seven as triangles.** Simpler, but it hides that the review is an AI.
- **A new "crew" kind** with its own shape and colour. It would tell the Apps from the org avatar at 20px, but it
  adds a shape, a colour and a term to the guide, and the guide's existing kinds already describe the Apps
  correctly.
- **All seven as agents.** That would use the agent shape for six things that aren't agents, which the guide and #81
  rule out.

The cost, which the owner accepted: at 20px a workflow App looks like the org avatar. GitHub prints the App's name
beside the image, so nothing relies on the avatar alone to identify it.

"The triangle appears at most once in a scene" is about a composed illustration. Each avatar is a separate image,
and a pull request's timeline isn't a scene. The guide's new subsection says so, so the rule isn't read as broken.

### D2. Composition: the head, and the prop on a badge (treatment B3, owner, 2026-11-01)

- The canvas is 500×500 with an opaque cream (`#FFF8EE`) background, as for the org avatar. On GitHub's dark theme
  the avatar is a cream tile, as the org's is. A transparent background would put an ink prop on navy, where it
  would disappear.
- The head sits top left. The triangle is the favicon's at scale 2.05 (translate 1, 0 on the 100 grid). The square is
  the mark's at h = 56, from (12, 12). That's a little smaller and higher than the first draft, so the badge clears
  both eyes.
- The badge is a sunflower disc, r 23 at (69, 69), inside a ring of cream 4 units wide, overlapping the head's lower
  right. The ring is the background showing through, so it separates the badge from the head without adding a colour
  to the scene. Everything stays inside the circle inscribed in the canvas, so it survives wherever GitHub rounds or
  crops the avatar.
- No reflection: below 40px it's a smudge, and it takes room the badge needs.
- The heads reuse the guide's geometry: the favicon's triangle (stroked path, round joins, eyes low in the wide part)
  and the mark's square (radius 0.28h, eyes centred high).

Considered, on one sheet at 20, 40 and 120px:
- **Held:** an ink prop over the head's corner, with no disc. The first draft's solid-ink props were clunky, and a
  line prop is faint where it crosses tomato.
- **A sunflower badge** without the ring, and smaller (B1, B2).
- **An ink badge** with a sunflower glyph (C). It's bold, but the dark disc pulls the eye from the face.
- **A centred head with the prop in front** (D). The most character-like, but the head shrinks and blurs at 20px.

The owner chose B3, the badge with a cream ring.

### D3. Props: simple ink line drawings (owner's picks, 2026-11-01)

Sunflower on cream is about 1.4:1, and on tomato under 2:1, so a sunflower prop would vanish. Ink on sunflower is
10.9:1, which the guide allows. So each prop is drawn in `--ink` round-capped lines, about 30 units across, on the
sunflower disc. It uses as few strokes as possible: the owner's test was that nothing closes up or turns into a blob
at 40px.

| App | Prop | Why |
|---|---|---|
| release | a rosette | a finished release |
| review | a checklist | it checks the pull request, point by point |
| dependabot | a pull request to an issue | it opens an issue for each Dependabot pull request |
| infrastructure | layers | the org as code, applied in layers |
| docs | an open book | it rebuilds the docs |
| dispatch | forward chevrons | it sends workflow runs onward |
| board | a board with three columns | it keeps the roadmap board's cards |

Considered: a tag, a ticket, a package and a flag for release; a tick, a speech bubble, a pencil and a magnifier for
review; a chain link, linked pages and an up-arrow for dependabot; a spanner, a gear and faders for infrastructure; a
script, a page, a bookmark and a closed book for docs; a paper plane, a megaphone, a cue light and an arrow for
dispatch; and eleven drawings for board. Most of the board drawings were too detailed at small sizes. Two columns read
as a pause button, and a card with a dot read as a key. The pull request to an issue looks most like a GitHub octicon;
the owner chose it knowing that.

**The props are line drawings, but they aren't topic icons.** The guide's §5 keeps characters apart from topic icons,
which are 2px line icons in `--tomato-text` on surface tiles. A prop here is `--ink` on a sunflower disc, never
tomato-text, and it's always held by a character's head. The guide's subsection says so.

### D4. One SVG per App, one template, entries generated from a list

- `brand/apps/<app>.svg` is the source for each App: the head, the eyes and the prop, drawn on a 100×100 viewBox with
  no background. Each file can be opened on its own, and it's what the colour check reads.
- `brand/templates/app-avatar.html?app=<app>` puts the SVG on the cream page at full size. The template doesn't draw
  anything, so each avatar has exactly one source.
- `scripts/assets.config.mjs` gets an `APPS` list (the App names). It maps that list to the `ASSETS` entries
  (`brand/out/app-<app>.png`, 500×500) and adds each source to `SOURCES`. The existing render and verify scripts need
  no change.

Considered: drawing every App in one template from query parameters. That gives fewer files, but the art then lives
in JavaScript, which the colour check can't read and the owner can't open as an image.

### D5. The guide's table is the list, and a unit test holds the rest to it

`scripts/app-avatars-lib.mjs` does two things. It reads the App table out of the brand guide's §5, and it checks one
App's SVG against its kind's palette: every colour is the head colour, white, ink, sunflower or cream (the ring's
background colour; the check can't tell where it's used, so the owner's review judges that); there's no gradient,
filter or opacity; and each stroke matches its own element's fill. `tests/unit/app-avatars.test.ts` runs both
against the real guide, `APPS` and `brand/apps/`, and against small fixtures for each failure in the spec. Vitest
already runs in `scripts/check.py` and CI, so nothing new is wired in.

Considered: reading the list from troupe-run/infrastructure's `oob/app-installations.json`. That puts a network
fetch of another repository into a unit test, and it would also need to exclude `dco`. A new App is rare and
deliberate, and adding it means adding its avatar by hand anyway. So the guide holds the list, and the task list
records where to look.

## Risks / Trade-offs

- [At 20px the six triangles look like the org avatar] → The owner accepted this (D1). The App's name is beside the
  image, and the prop reads from 40px.
- [A prop doesn't read at 40px] → The owner reviews every avatar at 20, 40 and 500px, on light and dark, before the
  change is done (spec, "The avatars read at GitHub's sizes"). A prop that fails is redrawn.
- [The badge reads like an icon or a status badge, not a character's prop] → The owner accepted this in choosing B3.
  It stays apart from topic icons by its colours (ink on sunflower, never tomato-text) and because it's always paired
  with a head (D3).
- [Cream is allowed for the ring, so the check would also pass cream used elsewhere, such as on the head] → The
  check holds which colours appear, not where. The owner's review judges placement (spec, "Each App's shape and
  colour follow its kind").
- [Infrastructure adds an App and nobody adds its avatar] → It would show GitHub's default icon, which is today's
  state, not a break. The guide's subsection names infrastructure's file as where the list comes from.
- [The colour check's parser misses a colour written another way (`rgb()`, a named colour, a `style` attribute)] → The
  check refuses any colour it can't read as a six-digit hex, so a new notation is an error, not a pass.

## Migration Plan

Merge, then the owner uploads each `brand/out/app-<app>.png` in that App's settings on GitHub (Settings → Developer
settings → GitHub Apps → the App → Display information). To roll back, delete the logo in the same place. Nothing in
the site build depends on the avatars.
