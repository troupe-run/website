# Design

## Context

The eight sources share one geometry on a 100×100 viewBox: the triangle head is the favicon's at
`translate(1 0) scale(2.05)` with white eyes `r 2` at `12.5,19` and `19.5,19`; the cream ring `r 27` and sunflower
disc `r 23` sit at `69,69`; the prop is drawn on a 24-unit grid at `translate(54 54) scale(1.25)` with
`stroke-width` 2.88, round caps and joins, `fill="none"`. `troupe-run-dispatch` is the nearest model: same head, a
two-stroke prop. The check already accepts a `system` App with the `triangle` head, so only the guide's table, the
render list and the test's list of real Apps change.

## Goals / Non-Goals

**Goals:**
- One more avatar, in the same form and geometry, whose merge symbol reads at 40px.

**Non-Goals:**
- Any change to the check, the template, or the other eight avatars. Their PNGs stay byte-identical.

## Decisions

### D1. The merge symbol: two curved lines joining into one, without node circles

On the 24-unit grid: two strokes start at the top (about `6,4` and `18,4`), curve in to meet at about `12,13`, and
one stroke runs on down to about `12,20`, an upside-down Y with soft shoulders, like two lanes merging. No circles at
the ends.

*Why not GitHub's git-merge octicon* (nodes as small circles joined by lines): `troupe-run-dependabot`'s prop is
already circles and a line (a pull request), and the two would blur together at 40px. *Why not straight lines*: a
straight Y reads as a fork or a peace sign more than a merge; the curves say the two become one. *Why not a down
arrowhead on the stem*: it adds strokes that close up at 40px and turns the symbol into an arrow. If the owner's
review finds the curved Y unclear, the fallbacks shown alongside are a sideways merge (two lines from the left joining
into one going right) and the straight Y.

### D2. The owner sees it before the pull request is ready

A contact sheet in the scratchpad, not committed: the new avatar at 500, 40 and 20px on light and dark backgrounds,
beside `troupe-run-dependabot` and `troupe-run-dispatch` (the two triangle Apps whose props are closest). It's sent
to the owner through the orchestrator, and redrawn until they agree.

## Risks / Trade-offs

- [The guide says its list follows infrastructure's `oob/app-installations.json`, which doesn't list
  `troupe-run-merge` until troupe-run/infrastructure#320 merges] → the App exists (ID 5832075) and the owner asked
  for its avatar now; the row is right once #320 lands, and nothing in this repository reads that file.
- [At 20px the prop blurs and the App looks like every other triangle] → the spec allows it; GitHub prints the App's
  name beside the avatar.
