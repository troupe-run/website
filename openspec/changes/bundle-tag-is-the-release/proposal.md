# Proposal

## Why

troupe.run reads core's tag, `troupe-v<version>`, as "the release": `scripts/troupe-docs-lib.mjs` chooses `/docs/`'s
versions from it, and `scripts/roadmap-lib.mjs` marks the status page's releases and `{latest}` by it. That stopped
being true with troupe-run/troupe#218 (owner, 2026-11-01, built in troupe-run/troupe#219): every package now versions on
its own, and the release people install is the bundle's tag, **`troupe-run-v<version>`**, released after its components
and pinning them. troupe already has `troupe-run-v0.1.0` (commit `46f3e9a`), on a different commit from
`troupe-v0.1.0` (`399a9e7`), so today `/docs/` is built from core's commit, before the bundle's release and before
troupe-run/troupe#208 switched the documented install to the tag. A bundle release that ships no new core release would
never reach `/docs/` or `/status/`, and as the two numbers drift apart, the status page would name core's version, not
the one people install. This is troupe-run/website#82.

It's also why troupe.run hasn't deployed since 2026-11-01 05:46 UTC: the `troupe-v` prefix matches core's tag and
also `troupe-vcs-files-v0.1.0` and `troupe-vcs-git-v0.1.0`, which the build then refuses as malformed release tags.
Every deploy dispatched since troupe's first component releases has failed on it, and the site serves the last good
build.

## What Changes

- **The release tag is `troupe-run-vMAJOR.MINOR.PATCH`**, for `/docs/` and `/status/` alike, read from one place in
  the code so the two can't disagree again. `/docs/` is built from the highest bundle tag's commit, earlier minors from
  their highest bundle patch, and "View source" links point at the bundle tag.
- **Core's `troupe-v*` tags are ignored**, like every other component's. **BREAKING** for a malformed core tag only:
  `troupe-v1.0.0-rc.1` used to stop the build and is now ignored; `troupe-run-v1.0.0-rc.1` stops it instead.
- **The status page** marks a milestone released when `troupe-run-v<version>` exists, dated by that tag, and names the
  highest bundle version as the latest release.
- **The fixture troupe is tagged like the real one**: bundle tags for the releases, plus core tags that disagree with
  them, so a test fails if either `/docs/` or `/status/` reads core's tag. The comments, README, tests and fixtures that
  name `troupe-v*` as the release follow.
- The protocol's versions (`protocol-v*`, `scripts/protocol-lib.mjs`) are unchanged, and no change is needed in troupe or
  infrastructure: troupe's release workflow already dispatches the deploy after every push to its `main`, which
  includes the merge that releases the bundle.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `versioned-docs`: the release tag that chooses `/docs/`, `/docs/next/` and the archived minors is `troupe-run-v*`;
  a malformed tag is one that starts `troupe-run-v`; core's `troupe-v*` is another component's tag, and ignored.
- `roadmap`: a milestone is released when `troupe-run-v<version>` exists, dated by it, and the latest release is the
  highest bundle version.
- `quality-check`: the fixture build's troupe is tagged with bundle releases and with core tags that disagree with
  them, and `/status/` is checked against the bundle's.
- `build-and-deploy`: the release scenario names the bundle's tag (`troupe-run-v0.2.0`) as what the dispatched deploy
  publishes at `/docs/`.
- `protocol-schemas`: the "another component's tag" scenario names `troupe-run-v0.1.0` alongside `troupe-v0.1.0`.

## Impact

- `scripts/troupe-docs-lib.mjs`, `scripts/roadmap-lib.mjs`, and a shared definition of the release tag.
- `scripts/troupe-fixture.mjs`'s doc comment, `scripts/rebuild-test.mjs`, `tests/fixtures/troupe-docs/` (step folder
  names and the pages' "at <tag>" lines), and the unit and end-to-end tests that name `troupe-v*` as a release.
- `README.md`'s note on `TROUPE_DOCS`.
- The published site: deploys work again, `/docs/` is built from `troupe-run-v0.1.0`'s commit and `/status/` reads the
  bundle's tags. Today both are `0.1.0`, and `docs/` is the same at both tags, so the pages and the version number
  don't change. `/status/` dates 0.1.0 by the bundle's tag (2026-11-01). The install page says `@main` until a bundle
  release includes troupe-run/troupe#208.
- No change to the version menu's or banners' words, the protocol, the deploy workflow, or troupe and infrastructure.
