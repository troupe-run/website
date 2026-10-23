# Proposal: status-roadmap-releases

## Why

`/status/` is out of date (troupe-run/website#32). It says troupe is still choosing a spec-driven development method,
and that the next steps are "the command line, the local daemon, roles and gates, and lineage". The method was chosen
long ago, the walking skeleton and config are built, and troupe-run/troupe#139 (2026-10-23) planned the road to 1.0
as 20 releases, 0.1.0 to 0.20.0, then 1.0.0. troupe-run/infrastructure#119 declared them as milestones in
`tofu/milestones.json`, which OpenTofu applies to every troupe-run repository.

#139 also says the milestones will be renumbered and re-described as the plan moves. A copy of the list typed into
this page would drift every time that happens, so the page takes the list from `tofu/milestones.json` itself, at
build time, and changing a milestone needs no second edit here.

## What Changes

- **`/status/` shows the planned releases, from the milestones.** Each build reads `tofu/milestones.json` from
  troupe-run/infrastructure's `main`, as it already reads troupe's docs from troupe-run/troupe, and lists every
  milestone in version order: its version and its description, word for word. 1.0.0 comes last, as the stability
  promise its description says it is.
- **It says which release is current.** A release is released when troupe has its tag (`troupe-v0.1.0` for 0.1.0),
  the same tags `/docs` is built from. The first unreleased milestone is marked as the one being worked on. Before
  the first release, the page says nothing has been released yet and work is on 0.1.0.
- **The status and the rest of the page are rewritten.** Status: pre-alpha, nothing released yet, and the first
  release is installed with uv from its tag (troupe-run/troupe#144). "How to read it" says each release is a planned
  set of things a user gets, the order can change, there are no dates, and links to troupe's milestones and the
  roadmap board for the issues behind each release. The old "Now" and "Next" sections go.
- **A malformed milestones file stops the build**, naming the file, the milestone and the fix, as a malformed release
  tag already does. A fetch failure stops it too, and `TROUPE_MILESTONES` builds from a local infrastructure checkout,
  as `TROUPE_DOCS` does for troupe.
- **The fixture build gets a fixture milestones file**, so the e2e tests check the list, the order and the current
  marker against fixed data, with troupe releases and without.

Decided here, as #32 asked (each is argued in design.md):

- The page shows **no progress counts** (open and closed issues). A static page's counts would be as old as its
  build, and the milestones span four repositories. It links to the milestones and the board instead.
- The **source** is `tofu/milestones.json`, not GitHub's milestones API: it's the declaration the milestones are
  applied from, it's public, and reading it needs no token and no rate limit.

Out of scope, as a follow-up issue in troupe-run/infrastructure: dispatching this site's deploy when
`tofu/milestones.json` changes on infrastructure's `main`, as troupe already does after every push to its `main`.
Until then, a changed milestone reaches the page on the next deploy, which runs on every merge here and every push to
troupe's `main`.

## Capabilities

### New Capabilities

- `roadmap`: what `/status/` says about where troupe is and the releases it's heading for, where that comes from, and
  what stops the build when the source is wrong or unreachable.

### Modified Capabilities

- `quality-check`: the fixture build also uses a fixture milestones file, so the roadmap's e2e tests don't depend on
  the live milestones.

## Impact

- New: a milestones reader beside `scripts/troupe-docs-lib.mjs` (fetch, check, order, write
  `src/generated/roadmap.json`), a Sätteri mdast plugin that renders the release list into `status.md` where it
  marks it, and a copy file `src/content/copy/roadmap.md` for the few words the list adds ("Released", "Working on
  now", the status line). The troupe-docs integration in `astro.config.mjs` runs the reader after the docs sync.
- `src/content/docs/status.md` is rewritten. Its copy is shown to the owner as text before it ships.
- `scripts/troupe-fixture.mjs` and `tests/fixtures/` gain the fixture milestones; `.cache/` holds the infrastructure
  clone, already ignored.
- Tests: unit tests for the reader (order, released and current, every refusal) and the plugin; e2e tests on
  `/status/` against the fixture build. The axe test already covers `/status/`.
- The owner sees `/status/` at 320px, 768px and 1280px, in light and dark, before it's called done.
- No new dependency: `yaml` is already a dev dependency, and git is already required by the build.
