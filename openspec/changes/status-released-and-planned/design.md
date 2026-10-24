# Design: status-released-and-planned

## Context

See proposal.md for why. Today (archived change `2026-10-23-status-roadmap-releases`, design D5, D6, D8):

- `scripts/roadmap-lib.mjs` reads `tofu/milestones.json`, marks each milestone against troupe's release tags and
  writes `src/generated/roadmap.json`: `releases`, in version order, each `{ version, description, released }`
  (`released` is the tag's day or null), and `latest`.
- `scripts/roadmap-plugin.mjs`, a Sätteri mdast plugin active for `src/content/docs/status.md` only, replaces two
  marker comments: `<!-- roadmap:status -->` with the status line, and `<!-- roadmap:releases -->`, under
  "## Milestones", with one ordered list (`ol.roadmap-releases`, `role="list"`, numbers hidden). A missing, repeated
  or unknown marker fails the build.
- Astro's Sätteri processor collects the page's headings, which Starlight's "On this page" shows, in a hast plugin
  (`heading-ids` in `@astrojs/markdown-satteri`'s `satteri-processor.js`). That runs after every mdast plugin, so a
  heading the roadmap plugin removes is never collected.
- Sätteri's mdast visitor context has `parent(node)`, `indexOf(node)` and `removeNode(node)`.

## Goals / Non-Goals

**Goals:**

- Two lists from the one `roadmap.json`, each in version order, Releases above Milestones (specs/roadmap).
- An empty section is gone from the page and from "On this page", with no words standing in for it.
- The section headings stay in `status.md`, where the owner reviews them and "Improve this page" leads.

**Non-Goals:**

- Any change to how the milestones are read, checked, ordered or marked: `roadmap-lib.mjs` and `roadmap.json` keep
  their shape.
- Links from a release to its notes or its docs version (owner, 2026-10-24).
- Any change to the status line or the copy file's words.

## Decisions

**D1. Two markers, one per section.** `status.md` gets `## Releases` with `<!-- roadmap:released ... -->` under it,
above `## Milestones`, whose marker is renamed from `roadmap:releases` to `roadmap:planned`. Each keeps the comment
saying the descriptions come from `tofu/milestones.json` in troupe-run/infrastructure. The old name becomes an
unknown marker, which already fails the build naming the valid ones, so a stale page can't quietly render nothing.

Considered: *one marker that renders both sections, headings included.* The headings would then live in the plugin or
the copy file, not in the page, and "Improve this page" would open a file without them.

**D2. The plugin splits the list; the data doesn't change.** `released` already says which list a milestone is in.
The plugin renders `releases.filter(r => r.released)` at `released` and the rest at `planned`, keeping the order
`roadmap.json` already has, so each list is in version order. The list item is unchanged: the version in bold, the
description verbatim, and on a released one the "Released {date}" span with a `<time>`.

Considered: *two arrays in `roadmap.json`.* It would change the sync's tested output and its tests for no reader the
filter doesn't already serve.

Both lists share one class. `roadmap-releases` is renamed `roadmap-list` in the plugin and `src/styles/starlight.css`,
since one of the two lists is the plan.

**D3. An empty section is removed by the plugin, heading and all.** When a marker's list would be empty, the plugin
removes the marker's section instead of rendering it: the nearest heading before the marker, at the same level of the
document, and every node from that heading up to the next heading of the same or a higher level (or the end). For
Releases that's its heading and marker; for Milestones, its heading, its introduction and its marker. Because headings
are collected after mdast plugins (Context), the section is gone from "On this page" too. A marker with no heading
before it fails the build, naming the page and the marker, since there's no section to remove.

Considered:

- *Hide it with CSS.* "On this page" would still link to it.
- *Always show Releases, with a line such as "None yet".* The owner chose to hide it (2026-10-24); the status line
  already says nothing has been released.
- *The plugin writes the heading only when there's a list.* The heading's words would leave `status.md` (D1).

**D4. "How to read it" changes one bullet; Milestones' introduction stays.** The bullet "A milestone gets a date when
it's released. The rest have none." no longer describes the page. Proposed, for the owner's review as text: "When a
milestone is released, it moves to Releases, with the day it came out." Releases gets no introduction: its entries'
dates say what it is. Milestones keeps "Each milestone is a set of things you'll be able to do, in the order we plan
to build them."

**D5. Tests.**

- Unit (`tests/unit/roadmap-plugin.test.ts`): each list holds the right milestones in order; with nothing released
  the Releases heading and marker are gone and the render's `headings` metadata has no Releases; with everything
  released Milestones' heading and introduction are gone; a marker with no heading before it, the old
  `roadmap:releases` name, and a missing or repeated marker each fail the page.
- Fixture e2e (`tests/e2e/versions.spec.ts`): Releases holds 0.1.0 and 0.2.0 with their dates; Milestones holds
  0.3.0, 0.10.0 and 1.0.0 with none; "On this page" is Status, Releases, Milestones, How to read it, in order.
- Live e2e (`tests/e2e/status.spec.ts`), shape only, since the live tags and wording change: every Releases entry has
  a date and no Milestones entry has one; no version is in both; each list is in version order; there's a Releases
  heading exactly when the status line names a latest release.

## Risks / Trade-offs

- [`removeNode` on a sibling of the node being visited behaves differently than expected in Sätteri's command
  buffer] → Task 1.1 proves it on a two-section page first. The fallback is to collect the nodes during the walk and
  remove them in the plugin's `after` hook.
- [The live build can't exercise "everything released"] → It's covered by the unit test only, and it can't happen
  while 1.0.0 is unreleased and declared.
- [A future edit puts a marker in a section with other content the owner wanted kept] → D3 removes the whole section
  by design; the comment beside each marker says so.

## Migration Plan

Merging deploys the new page. Before 0.1.0 the live page differs only in "How to read it", since Releases is hidden.
Rollback is reverting the merge.
