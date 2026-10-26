# Proposal

## Why

website has a contributing guide of its own, written when the org's guide in troupe-run/.github asked every
contributor for a DCO sign-off (#31). The owner decided on 2026-10-23, while planning troupe-run/infrastructure#119,
that there's one guide for every repository. troupe-run/infrastructure#120 (merged in infrastructure#134) made the org
guide cover website: its licences, no sign-off, the trademark note, the outside-fix route, Conventional Commits and the
check before each commit. So website's own guide now repeats the org guide, and two copies of the same rules drift.

## What Changes

- What only applies to website moves to its README, under three headings:
  - **Setting up**: uv, Node at `.nvmrc`'s version, `npm ci`, git and a network connection.
  - **Running it locally**: `npm run dev`, the docs and schema sync from troupe and `TROUPE_DOCS`, the milestones and
    `TROUPE_MILESTONES`, `uv run scripts/check.py`, the fixture build, the rebuild test, the unit and e2e suites and
    their ports, and brand assets.
  - **Fixing or improving a page**: docs pages are edited in troupe; other pages here; `/docs/v0.1/…` links
    **View source** at the tag. An outside contributor's failing `guard` check is expected, and the org guide's
    "A fix from outside" section says what happens next.
- The README links the org guide for the workflow, commit messages, sign-off and contribution terms, and keeps its
  licence section.
- **`CONTRIBUTING.md` is deleted.** With no guide of its own, GitHub shows the org's guide for website.
- `CLAUDE.md` points at the README for setting up and at the org guide, not at `CONTRIBUTING.md`. Its workflow and
  its "no sign-off" line stay.
- `scripts/check-paths.toml` drops `CONTRIBUTING.md` from the paths no gate reads.
- A new test fails if website gains a contributing guide of its own again, or if a file links to one.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `contributing`: the requirements that name `CONTRIBUTING.md` move to the README (tools, setup, fixing a page, the
  outside fix, licences) and to `CLAUDE.md` (workflow, commits). The org guide is linked for the rest, not restated.
  A new requirement says website has no contributing guide of its own, so GitHub shows the org's.

## Impact

- `README.md`, `CLAUDE.md`, `scripts/check-paths.toml`, a new `scripts/tests/test_contributing.py`, and the deleted
  `CONTRIBUTING.md`. No page, component, build step or CI workflow changes.
- The site's Backstage **Contributing** link already points at the org guide
  (`src/lib/docs-nav.ts`, spec: versioned-docs) and doesn't change.
- Out of scope: the org guide's text, which is changed in troupe-run/infrastructure (`org-profile/CONTRIBUTING.md`).
  Historical records that mention the file (`docs/superpowers/`, archived OpenSpec changes) are left as written.
