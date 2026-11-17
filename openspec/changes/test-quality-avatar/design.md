# Design

## Context

The app-avatars spec ties an App's head colour to its kind: `scripts/app-avatars-lib.mjs` maps `system` to tomato
and agent to teal, and checks each source against that palette. The guide's §5 table (`App | Kind | Prop`) is the
list the check reads. The owner chose a teal bug head for `troupe-run-test-quality`, a `system` App (#128), so with
today's check its source would fail as "teal in a system source".

The seven sources share one geometry on a 100×100 viewBox: the head top left (the square is `x 12–68, y 12–68`, the
triangle is the favicon's at `translate(1 0) scale(2.05)`), the cream ring `r 27` and sunflower disc `r 23` at
`69,69`, and the prop drawn on a 24-unit grid at `translate(54 54) scale(1.25)` with `stroke-width` 2.88 (3.36 on the
board, whose grid lines are denser), round caps and joins.

## Goals / Non-Goals

**Goals:**
- One more avatar, in the same form and geometry, that reads as a bug holding a magnifier at 40px.
- The exception is written down once, in the guide's table, where the check reads it.

**Non-Goals:**
- Redrawing or re-rendering the other seven avatars. Their PNGs stay byte-identical.
- A general "any head, any colour" mechanism. Each head the check knows is listed with its colour and the kinds it's
  for.

## Decisions

### D1. The guide's table gains a Head column; the check reads the colour from the head

The table becomes `App | Kind | Head | Prop`. The check knows three heads: `triangle` (tomato, `system` only),
`square` (teal, agent only) and `bug` (teal, `system` only, the recorded exception). A head it doesn't know, or a head
on a kind it isn't for, fails the check naming the App: a malformed row is an error, never a fall-through to the kind's
default.

*Alternatives:* a hard-coded exception for one App in the check (the fact would then live in two places, and the guide
wouldn't show it); a third kind such as `system-bug` (it would mix what the App is with how it's drawn, and kind is the
glossary's actor kind, which has no such value). Keeping kind and head separate keeps "teal square means agent" true:
the square can't go on a `system` App, and the bug can't go on an agent.

### D2. The bug head

A rounded bug body in teal inside the square's footprint (about `x 14–66, y 18–68`), with two round white eyes at the
same size and height as the square's (`r 4.4`, `y ≈ 37`), two short antennae and stubby legs on the left drawn as
teal strokes with `fill="none"` and round caps. The badge covers the lower right as it does for every App, so the legs
on that side may be hidden by it. Legs and antennae are thick enough (about 4 units) to survive at 40px; at 20px the
spec lets the detail blur to a teal blob with eyes, and GitHub prints the App's name beside it. The final shape is
whatever the owner agrees reads as a bug at 40px (D4).

### D3. The magnifier prop

On the same 24-unit grid as the others: a circle lens (about `r 5.5` at `10,10`) and a handle from the lens's lower
right to about `19,19`, ink, `stroke-width` 2.88, `fill="none"`. Two strokes, so it can't close up at 40px.

### D4. The owner sees it before the pull request is ready

A contact sheet in the scratchpad, not committed: the new avatar at 500px and 40px (and 20px for reference), on light
and dark backgrounds, next to the review App's square so the teal shapes can be told apart. It's sent to the owner
through the orchestrator, and redrawn until they agree.

## Risks / Trade-offs

- [A teal head on a non-agent App blurs what teal means] → the guide says it's the only one and why; the check
  refuses the bug on an agent and the square on a `system` App; the bug's silhouette (antennae, legs) differs from
  the square's at 40px, and the owner checks the two side by side.
- [At 20px the bug reads as a teal blob, like the review App's square] → the spec allows the prop and detail to blur at
  20px; GitHub prints the App's name beside the avatar.
