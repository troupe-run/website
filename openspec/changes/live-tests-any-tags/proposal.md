# Proposal

## Why

`tests/e2e/protocol.spec.ts` runs against the live build, which is built from troupe-run/troupe as it is now, and it
assumes troupe has no `protocol-v*` tag. troupe tagged `protocol-v0.1.0` on 2026-11-01, so two of its tests fail on
every build against the real troupe, whatever the pull request changes:

- "/protocol/ lists the four kinds of URL, and says there is no protocol release yet and what serves main" expects
  "No protocol release yet." and no release list. The page now lists 0.1.0.
- "no copy is served for a major version or a release that troupe has no tag for" expects
  `/protocol/0.1.0/config/actor.schema.json` to be a 404. It's served now, because it's in the tag.

This is troupe-run/website#84. It blocks troupe-run/website#82 (`bundle-tag-is-the-release`), whose check can't pass
until this is fixed.

## What Changes

- **The live `/protocol/` tests read what the build recorded.** They take the protocol releases and copies from the
  build's manifest (`src/generated/troupe-docs.json`, `protocol`), as `docs.spec.ts` already does for `/docs`. They
  check that the page and the served copies match those, whether the list is empty or not:
  - The page lists the four kinds of URL. With no release it says "No protocol release yet." and has no release list.
    With releases it lists them newest first, names the latest, and doesn't say there's no release.
  - Every copy in the manifest is served as JSON, with its own copy's `$id`.
  - A release or major version the manifest doesn't have, the next patch and the next major after the latest
    release, is a 404.
- **The header comment says the live build is troupe as it is now, with or without releases**, and points to
  `versions.spec.ts` for the fixed cases.
- **The fixture tests don't change.** `versions.spec.ts` keeps testing a troupe with protocol releases, against
  fixed tags. The page's behaviour (spec: protocol-schemas) doesn't change.
- **No other live test assumes troupe has no release.** The other live tests were read for this: `status.spec.ts`
  already checks only the shape of the roadmap, and `docs.spec.ts` reads the manifest. Only `protocol.spec.ts`
  changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `quality-check`: a new requirement, "The live build's tests hold whatever releases troupe has". The end-to-end
  tests of the live build check what troupe's tags, as the build recorded them, should produce. Behaviour that
  depends on how many releases there are is tested on the fixture build.

## Impact

- `tests/e2e/protocol.spec.ts`: rewritten to read the manifest.
- `openspec/specs/quality-check/spec.md`, through this change's delta.
- No site code, page, copy, workflow or guard file changes.
- **Landing order with #82.** On main the live build doesn't get as far as these tests. troupe's new component tags
  (`troupe-vcs-files-v0.1.0` and others) start with `troupe-v`, so the docs sync refuses them as malformed release
  tags and the build stops. #82 changes the release tag to `troupe-run-v*`, which fixes that. Each pull request's
  check therefore needs the other's fix to pass. How they land together is the owner's decision (design, Open
  questions).
