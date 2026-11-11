A troupe history for the fixture build (`npm run build:fixture`; spec: quality-check; design D9). Each folder is one
commit, oldest first, holding the whole of `docs/`, of `protocol/` or of both; `scripts/troupe-fixture.mjs` commits
them in order into a throwaway git repository, keeps a folder a step doesn't hold from the step before, and tags each
with the tags its name lists after the number, joined by `+`, except `main`. Between versions a page is removed
(`old-guide`), one is renamed (`build-a-flow` to `design-a-flow`), one is added (`roles-and-actors`, planned) and one
exists only on main (`new-guide`, which the site's sidebar order doesn't name). `opening-night/install` is in the
last release and on main because the landing page links to `/docs/opening-night/install/`, and the fixture build's
link check would otherwise find it broken (troupe-run/website#83). `new-guide` links a file and a folder on main by
their GitHub URLs (`blob/main/protocol/schemas/error.schema.json`, `tree/main/protocol/schemas/events`), so the fixture
build runs the check that links from main into troupe's repository lead somewhere (troupe-run/website#112). Pointing
either at a path main doesn't have fails the build.

The releases are the bundle's tags, `troupe-run-v*`, as on troupe-run/troupe (bundle-tag-is-the-release design D3).
Core's `troupe-v*` tags disagree with them on purpose: `troupe-v0.3.0`, higher than any bundle release, is on
`troupe-run-v0.1.1`'s commit, and `troupe-run-v0.2.0` has no core tag. A build that read core's tag as the release
would publish v0.3 at `/docs/` from the wrong commit and mark 0.3.0 released on `/status/`, and the tests would fail.

`protocol/schemas/` (protocol-schemas design D9): `4-main` holds every schema on troupe-run/troupe's `main` at 30402fa
(2026-10-24), copied verbatim. The tagged steps hold three of them verbatim (`lineage`, `error`, `runner/errors`,
which use a `$dynamicRef` and cross-folder references with pointers). `pinned.schema.json` is the fixture's own: it
names its step in its `description`, makes the one absolute reference, gains a definition (`added`) at
`protocol-v0.2.0`, and renames it (`renamed`) at `protocol-v1.0.0`, a breaking change. `main` adds the rest of troupe's
schemas after the last tag.
