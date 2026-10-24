# Proposal: status-milestones-refresh

## Why

troupe-run/website#35: on 2026-10-24, troupe-run/infrastructure#128 renumbered the milestones, and a deploy dispatched
afterwards read the new `tofu/milestones.json` (its log says `/status/ lists 21 releases`) but published `/status/`
with the old order. The owner confirmed the cause on the issue. Deleting every `astro-cache-Linux-*` cache and
deploying the same website commit against the same infrastructure data published the new order. The restored
`node_modules/.astro` was the only difference.

In Astro 7.3.6, the glob loader that Starlight's `docsLoader` wraps (`astro/dist/content/loaders/glob.js`) skips an
entry whose file digest matches the stored one, and keeps its stored render. `status.md` and `protocol.md` never
change when their lists do, because the lists are rendered into them at build time from `src/generated/`. So a stored
render outlives the data it was made from:

- **In the deploy,** `withastro/action` restores the store by an exact key on the website commit, or else by the
  `astro-cache-Linux-` prefix, which brings back the most recent store whatever commit made it.
- **Locally,** `node_modules/.astro` stays between builds, so the roadmap spec's "previewing a milestone edit" with
  `TROUPE_MILESTONES` shows the old list after an earlier build.

The store is cleared only when Astro's config digest changes, and the redirects are part of that. A new minor release
of troupe adds a docs version, and so a redirect, so it clears the store by accident. A patch tag, a protocol tag, a
milestone edit and a copy edit don't.

## What Changes

- **A page rendered from generated data is rendered again whenever that data changes.** The docs collection's loader
  records a digest of the inputs each such page is rendered from. When the digest differs from the one it recorded,
  it drops that page's stored entry before the glob loader runs, so the entry is rendered from the current data. This
  uses only the Content Loader API (`meta`, `store`).
  - `/status/`: `src/generated/roadmap.json` (milestones and release tags) and `src/content/copy/roadmap.md`.
  - `/protocol/`: the protocol releases in `src/generated/troupe-docs.json` and `src/content/copy/protocol.md`.
- **A rebuild test shows it.** The check builds the fixture site, changes only the milestones and builds again on the
  same store. It then does the same with only new release tags (a troupe patch tag and a protocol tag). Each time it
  asserts the built `/status/` and `/protocol/` show the new data. It's written first and fails on `main`.
- **The deploy keeps its build cache.** Turning it off (`cache: false`) would fix the deploy only: local builds would
  still be stale, and every deploy would re-render every docs version from nothing (design D1).

Unchanged: where the milestones and tags come from, what the pages say, every refusal for a malformed or unreachable
source, and the deploy workflow.

Out of scope: troupe-run/troupe#139, the related gap where nothing in infrastructure starts a website build when the
milestones change. This change makes the next build right, but doesn't make one happen.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `roadmap`: a build shows the current milestones and release tags even when an earlier build's content store is
  restored and nothing in this repository changed.
- `protocol-schemas`: the same for `/protocol/`'s release list and protocol tags.
- `quality-check`: the check rebuilds the fixture site on an earlier build's store and checks that the generated lists
  follow their sources.

## Impact

- `src/content.config.ts`: the docs collection's loader wraps `docsLoader()` with the invalidation.
- A new module under `scripts/` holds the table of pages and their inputs, and the wrapper, with unit tests under
  `tests/unit/`. `astro.config.mjs` registers the two page plugins from that table.
- `scripts/troupe-fixture.mjs` and `scripts/check.py`: the rebuild test and its gate. `scripts/tests/test_check.py`
  follows the gate list.
- No dependency, workflow, copy or page text changes. `withastro/action`'s cache stays on.
