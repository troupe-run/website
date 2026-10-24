# Proposal: status-released-and-planned

## Why

Since troupe-run/website#32 (PR #33), `/status/` has one list, "Milestones": every milestone in
troupe-run/infrastructure's `tofu/milestones.json`, in version order, with "Released" and its tag's date on one that's
out. That works while nothing is released. Once 0.1.0 is out, the list mixes versions a reader can install with
versions that are still a plan, and "Milestones", the owner's word for a plan, no longer covers them all. The owner
suggested splitting the two (2026-10-23), and troupe-run/website#34 asks for it before releases land.

## What Changes

- **`/status/` gets a Releases section, above Milestones.** Releases lists the milestones that are out, in version
  order, each with its version, its description and "Released" with its tag's date, as now. Milestones lists the
  rest, in version order, with no date. Every milestone is in exactly one of the two, decided by troupe's release
  tags as now. The page reads past to future: Status, Releases, Milestones.
- **A section with nothing in it is left out.** Before 0.1.0, the page has no Releases heading, no empty list, and
  no entry for it in "On this page"; the status line already says nothing has been released yet. The same rule hides
  Milestones once every declared milestone is out, so neither case needs words of its own.
- **"How to read it" goes** (owner, 2026-10-24: "it's not needed"), with its links to troupe's milestones and the
  roadmap board, and its closing line. Milestones' introduction still says the list is a plan.
- **The fixture build's tests check the split**: 0.1.0 and 0.2.0 under Releases with their tags' dates, and 0.3.0,
  0.10.0 and 1.0.0 under Milestones with none.

Decided with the owner (2026-10-24), as #34 asked:

- **Order:** Releases first, then Milestones.
- **Names:** "Releases" for what's out, and the plan keeps "Milestones".
- **A released version shows** its version, description and date, as now. No link to release notes, which troupe
  doesn't publish yet, and no link to its `/docs/vX.Y/` version; either can come in a later change.
- **Before 0.1.0:** the Releases section isn't shown.

Unchanged: where the list comes from, how a milestone is marked released, the patch-release rule (`troupe-v0.1.1`
adds no entry), the status line and its copy, and every refusal for a malformed or unreachable milestones file.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `roadmap`: the list becomes two, Releases and Milestones, each in version order; a released milestone moves to
  Releases with its date; a section with no milestones in it is left out; the page no longer has a "How to read it"
  section, nor its links to troupe's milestones and the board.
- `quality-check`: the fixture build's roadmap scenario checks the two sections, not one list.

## Impact

- `src/content/docs/status.md`: a Releases heading with its own marker, above Milestones; the Milestones marker
  renamed; "How to read it" removed.
- `scripts/roadmap-plugin.mjs`: renders two lists from `src/generated/roadmap.json`, and removes a section whose list
  would be empty.
- `src/content/copy/roadmap.md`: its comment only; its words are unchanged.
- Tests: `tests/unit/roadmap-plugin.test.ts`, `tests/e2e/status.spec.ts` (live build, shape only) and
  `tests/e2e/versions.spec.ts` (fixture build).
- No change to `scripts/roadmap-lib.mjs`, the milestones fixture, the data the sync writes, or any dependency.
