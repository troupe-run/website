# Design

## Context

The site is tested end to end on two builds (`playwright.config.ts`). The `chromium` project tests the live build,
which is troupe-run/troupe as the sync fetched it. The `versions` project tests the fixture build, a generated troupe
with fixed `troupe-v*` and `protocol-v*` tags (quality-check, "The fixture troupe has protocol releases"). The sync
writes a manifest, `src/generated/troupe-docs.json`. Its `protocol` field is
`{ copies: { prefix, ref, files }[], releases: string[] }` (`writeProtocol` in `scripts/protocol-lib.mjs`), with the
releases newest first and the latest copy's prefix `''`. `docs.spec.ts` already reads this manifest to test `/docs`
against whatever troupe has.

`protocol.spec.ts` hard-codes the case with no release. Since `protocol-v0.1.0` (commit `399a9e7`), the manifest's
copies are `''`, `0/` and `0.1.0/` at the tag, plus `next/` at main, and `releases` is `['0.1.0']`. Every copy at the
tag has `config/actor.schema.json`.

## Goals / Non-Goals

**Goals:**

- The live `/protocol/` tests pass, and still catch a broken page or copy, with no `protocol-v*` tag or with several.
- Each test's name says what its body checks, in both cases.

**Non-Goals:**

- Checking that the manifest matches troupe's real tags. The sync's choice of copies is tested in
  `tests/unit/` (protocol-lib), and with fixed tags on the fixture build.
- Changing `versions.spec.ts`, the page, its copy or the sync.
- The docs sync refusing troupe's new component tags (`troupe-vcs-files-v0.1.0`). That's #82's change. See Open
  questions for how the two land.

## Decisions

### D1. Read the releases from the build's manifest, not from troupe or a hard-coded list

The tests load `src/generated/troupe-docs.json` the way `docs.spec.ts` does, and check the page and the copies against
its `protocol` field.

- *Alternative: hard-code `protocol-v0.1.0`.* This fails again at the next protocol release, which is the same bug.
- *Alternative: ask GitHub for troupe's tags (`git ls-remote`) in the test.* This adds a network call to the tests, and
  can disagree with the build when a tag lands between the sync and the test run. The manifest is what the build was
  made from, so it's the right thing to check the build against.
- *Alternative: check only what holds either way* (for example, "the page shows a release list or the no-release
  line"). This is weaker: it passes even if the page lists the wrong releases. Reading the manifest keeps the exact
  checks.

The cost of D1 is that a wrong manifest makes the expectations wrong too. The sync's unit tests and the fixture build
cover that (Non-Goals).

### D2. One test for the release list, which takes whichever branch the manifest gives

The release-list test is named for both outcomes: "/protocol/ lists the four kinds of URL, and the build's protocol
releases newest first, or says there is none and what serves main". With no release it asserts the "No protocol release
yet." line and no `.protocol-releases`. With releases it asserts `.protocol-releases li` is exactly the manifest's
releases, with the first marked "(latest)" in the copy's wording (`src/content/copy/protocol.md`'s `latest` and
`release`), and no "No protocol release yet." line. This is the same as `versions.spec.ts`'s check, but with the
versions taken from the manifest.

- *Alternative: two tests, each skipped unless its case applies.* A skipped test shows in the report, so the gap stays
  visible. But one of the two would always be skipped on the live build, and the fixture build already covers the case
  with releases. One test whose name says it takes either branch matches `status.spec.ts`'s "has a Releases section
  exactly when…".

### D3. Request each copy in the manifest, not a fixed list of prefixes

There's one test for each copy in the manifest (`''`, `0/`, `next/`, and one for each `<version>/`). Each requests
`config/actor.schema.json` and checks it is JSON, with the `$id` `https://troupe.run/protocol/<prefix>config/actor.schema.json`.
The latest copy's prefix is `''`, so its id is troupe's unversioned one. The test names come from the manifest, so the
report shows which copies were checked.

`config/actor.schema.json` is on main and at `protocol-v0.1.0`. If a later tag doesn't have it, the copy's test fails
and names the prefix. That's an honest failure, and the fix is to pick a schema present in every copy, which the test
can then read from `public/protocol/<prefix>`. The design doesn't do that now, because it would test the served file
against the file the sync wrote, which proves less than a fixed path.

### D4. The 404 test uses versions just past the latest release

"No copy is served for a major version or a release that troupe has no tag for" requests
`/protocol/<next major>/config/actor.schema.json` and `/protocol/<next patch>/config/actor.schema.json`. The next major
is one more than the latest release's major, or `1` with no release. The next patch is the latest release with its
patch number plus one, or `0.1.0` with no release. These are the copies most likely to be served by mistake, and
neither is in the manifest by construction. The test also asserts that neither prefix is among the manifest's copies,
so the premise is checked, not assumed.

## Risks / Trade-offs

- [The live suite can't run on main until the docs sync accepts troupe's component tags] → Verify this change on a
  build that includes #82's tag fix (tasks, section 2), and land the two in the order the owner chooses (Open
  questions).
- [A wrong manifest makes these tests agree with a wrong page] → Accepted (D1). The sync is tested on its own, and with
  fixed tags.
- [A tag that drops `config/actor.schema.json`] → Its copy's test fails, naming the prefix (D3).

## Migration Plan

None. This is a test-only change, so nothing deploys differently.

## Open Questions

- **How this change and #82 land.** On main the live build stops at `troupe-vcs-files-v0.1.0` before any test runs,
  and #82's check fails on this change's two tests. So neither pull request passes `test` on its own. This doesn't
  change the tests or the tasks, only the merge order, so it's for the owner to decide when the pull request opens. One
  option is that #82's branch builds on this one, and one pull request through the merge queue lands both. The other is
  that the owner merges one of them with `--admin`.
