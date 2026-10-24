# Proposal

## Why

troupe's JSON Schemas carry `https://troupe.run/protocol/...` ids, and troupe already writes
`https://troupe.run/protocol/0/config/actor.schema.json` into the config files it creates, but nothing is served at
those URLs. Editors can't check the files, and plugin authors and other languages can't fetch the schemas. Issue #30
asks troupe.run to serve them from troupe-run/troupe's `protocol/schemas/`, versioned on their own like `/docs`
(owner, 2026-10-21, on troupe-run/troupe#60). troupe#140, now closed, gave the protocol its own `protocol-v*` tags, so
the site can be built from them.

## What Changes

- Every build reads troupe-run/troupe's `protocol/schemas/` at `main` and at each `protocol-vMAJOR.MINOR.PATCH` tag, from
  the same source `/docs` uses (the fetched clone, or `TROUPE_DOCS`'s checkout), and publishes:
  - `/protocol/<path>`: the latest protocol release, or `main` while there's none.
  - `/protocol/<major>/<path>`: the highest release with that major version. While there's no release at all,
    `/protocol/0/` serves `main`, so the URL troupe writes today resolves (design D3; owner, 2026-10-24).
  - `/protocol/next/<path>`: troupe's `main`, always.
  - `/protocol/<version>/<path>`: exactly the `protocol-v<version>` tag, one directory per tag that exists, so a
    deleted tag's directory goes and a recreated tag's is rebuilt.
- Each copy's `$id`s, and any absolute reference to one of troupe's own schemas, are rewritten to that copy's URLs, so
  references inside a copy stay inside it. The latest copy keeps troupe's unversioned ids.
- The build refuses, naming the tag or file and the fix: a `protocol-v` tag that isn't `MAJOR.MINOR.PATCH`, a file
  that isn't a `.schema.json` that parses as a JSON object, an `$id` that isn't the file's own unversioned URL, and an
  absolute reference under `troupe.run/protocol/` that doesn't name a schema in the same copy.
- A new check, run with the internal link check on every build CI and the deploy check, resolves every `$ref` and
  `$dynamicRef` in every published copy, fragment included, and fails naming the file, the reference and why.
- The schemas are served as static `.json` files, which GitHub Pages serves as `application/json`.
- A short page at `/protocol/` (the site's own, like `/status/`) says which path to use when and lists the published
  releases. Its words are shown to the owner before they ship.
- The fixture build gains `protocol/schemas/` and `protocol-v*` tags, so every path is tested before troupe's first
  protocol release.

## Capabilities

### New Capabilities

- `protocol-schemas`: which copies of troupe's protocol schemas troupe.run publishes under `/protocol/`, at which
  paths, from which refs; the id rewrite; what stops the build; the reference check; and the page that explains the
  paths.

### Modified Capabilities

- `build-and-deploy`: a deploy's pre-publish link check also checks the schemas' references.
- `quality-check`: the fixture troupe also has protocol schemas and `protocol-v*` tags, so `/protocol/`'s copies are
  tested.

## Impact

- `scripts/`: a new protocol module beside `troupe-docs-lib.mjs`, sharing its source (`openSource`); `troupe-docs.mjs`
  and the integration in `astro.config.mjs` call it; `linkcheck.mjs` also runs the reference check; the fixture
  builder handles protocol steps and tags.
- Generated output in `public/protocol/` (gitignored, replaced on every run), and a new page `src/content/docs/protocol.md`.
- Tests: unit tests for version choice, the rewrite, the refusals and the reference check; e2e tests on the built
  site and the fixture build; fixture files under `tests/fixtures/`.
- No change in troupe-run/troupe: its `notify-website` job already rebuilds the site on every push to `main`, after
  release-please has made that run's tags. No change in troupe-run/infrastructure.
- Out of scope: troupe's side (troupe#140, done), versioning `/docs` differently.
