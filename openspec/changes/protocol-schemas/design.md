# Design

## Context

- **troupe's protocol today** (troupe-run/troupe `main` at 30402fa, 2026-10-24): 46 files under `protocol/schemas/`,
  all `*.schema.json`, draft 2020-12, in five folders (`client/`, `config/`, `events/`, `runner/`, and the top level).
  Each has one `$id`, at the top, of the form `https://troupe.run/protocol/<path>`. Every `$ref` between them is
  relative (`../lineage.schema.json#/$defs/hash`, `#/$defs/seq`, `#`). Two extension points use `$dynamicRef` with a
  matching `$dynamicAnchor` in the same file (`#runnerOptions`, `#runnerErrors`). No schema holds an absolute reference
  to another today, but troupe's `contributing/runners.md` shows a runner's own schema doing so.
- **Protocol releases** (troupe#140, closed): release-please tags the protocol `protocol-vMAJOR.MINOR.PATCH` on its
  own, only when `protocol/` changes. There's no tag yet. The troupe package records the protocol release it carries
  in `packages/troupe/src/troupe/protocol/version.json` (`0.0.0` today), and writes
  `https://troupe.run/protocol/<major>/config/actor.schema.json` into the config files it creates: `/protocol/0/...`
  today.
- **The rebuild trigger exists.** troupe's `notify-website` job dispatches this site's deploy after every push to
  `main`, after release-please has made that run's tags (spec: build-and-deploy). A tag deleted by hand sends no notice.
- **How `/docs` is built** (spec: versioned-docs): `scripts/troupe-docs-lib.mjs`'s `sync` opens one source (a bare
  clone in `.cache/troupe.git`, fetched with `--prune` on every run, or `TROUPE_DOCS`'s checkout, whose `main` is its
  working tree), checks every input and writes generated files with a marker, refusing to clear a folder it didn't
  write. The `troupe-docs` integration in `astro.config.mjs` and `npm run docs:sync` both call it. Its `Source`
  reads only `docs/` (`list`, `read`), plus `readRepo` for a single file.
- **The link check** (`scripts/linkcheck.mjs`) runs linkinator over the HTML of `dist/` and `dist-fixture/` in
  `scripts/check.py`, and over `dist/` in the deploy before it publishes. linkinator doesn't read JSON references.
- **GitHub Pages** serves `.json` files as `application/json`, with `Access-Control-Allow-Origin: *`. It can't set
  headers per path, and doesn't need to here.

## Goals / Non-Goals

**Goals:**
- One source and one fetch for `/docs` and `/protocol/`, so both always come from the same troupe at the same moment.
- Every input from troupe (tags, files, ids, references) is checked, and anything unexpected stops the build naming the
  ref, the file and the fix.
- Every path is tested on every check, before troupe's first protocol release and after it.
- No new npm dependency, no new component override, no workflow change.

**Non-Goals:**
- Validating the schemas themselves against the meta-schema, or troupe's strictness rules: troupe's
  `test_protocol_strict.py` does that, next to the schemas.
- An index or listing per copy (`/protocol/0/` has no page). The page at `/protocol/` and troupe's protocol README say
  what exists.
- Serving runners' or plugins' schemas. Only troupe's own `protocol/schemas/` is published.
- Rebuilding when a tag is deleted by hand (Risks).

## Decisions

### D1. One sync, one source, two outputs

`sync` opens the source once and builds both `/docs` and `/protocol/`. The `Source` gains a general reader for a folder
at a ref (`listTree(ref, dir)`, `readFile(ref, path)`), which `list` and `read` become thin wrappers over, so the local
checkout's "main is the working tree" rule covers `protocol/schemas/` too. A missing `protocol/schemas/` at `main` or at
a `protocol-v*` tag stops the build: troupe has had it since before its first tag, so its absence means something is
wrong. The manifest in `src/generated/troupe-docs.json` gains a `protocol` entry (the copies, each with its prefix and
ref, and the protocol releases) for the page and the tests.

*Alternative:* a second, separate sync for the protocol. Rejected: two fetches can see two different troupes, and the
error handling, `TROUPE_DOCS` checks and cache would be written twice.

### D2. The copies are chosen from the tags, as the docs versions are

A pure function, beside `chooseVersions`, turns the tag list into copies `{ prefix, ref, rewrite }`:

| Copy | Prefix | Ref | Ids rewritten |
|---|---|---|---|
| Latest | `` | highest `protocol-v*`, or `main` | No |
| Each major M | `M/` | highest tag with major M | Yes |
| next | `next/` | `main` | Yes |
| Each tag X.Y.Z | `X.Y.Z/` | `protocol-vX.Y.Z` | Yes |

Tags are compared as three numbers, never as text (0.10.0 is above 0.9.0). The tag form is the docs' rule with
`protocol-v` for `troupe-v`, and refuses the same way (spec: protocol-schemas). Each copy's files are read and checked
once per ref, so a tag that is also the latest and its major's highest is read once and written three times.

### D3. Before any release, `/protocol/0/` serves `main`

The issue's table says a major-version path serves "the latest release with that major version", which before any
release is nothing. But troupe already writes `https://troupe.run/protocol/0/config/actor.schema.json` into every
config file it creates, and the point of serving the schemas is that an editor can check those files. So, while there's
no `protocol-v*` tag, `/protocol/0/` is built from `main`, as `/protocol/` is. Once a release exists, only tagged
releases make major copies (owner, 2026-10-24). The spec's "Each major version has a copy" states it.

*Alternatives:* serve nothing at `/protocol/0/` until the first release (editors fail on troupe's own files until
then); or take the major from `main`'s `version.json` (`0.0.0`, so the same result today, but it couples the site to a
file inside troupe's package for no gain before 1.0).

### D4. The rewrite works on parsed JSON, on three keywords only

Each file is parsed, checked, rewritten and written as `JSON.stringify(value, null, 2)` plus a newline, for every copy,
the latest included, so the published files are consistent and the bytes don't depend on troupe's formatting. The walk
treats `$id`, `$ref` and `$dynamicRef` as keywords when their value is a string, and doesn't descend into `const`,
`enum`, `examples` or `default`, whose contents are data. A rewritten value keeps its fragment
(`.../lineage.schema.json#/$defs/hash`). Descriptions and other strings are never touched, so prose that names a
versioned URL stays as written.

*Alternative:* textual find-and-replace on the file. Rejected: it can't tell an id from a description holding the same
URL, and the spec says text is left alone.

### D5. The checks run before anything is written

For each ref, before any output: every path is `*.schema.json` and parses as an object; no top-level folder is `next`,
a whole number or `X.Y.Z` (it would land on another copy's URLs); the top-level `$id` is the file's unversioned URL; a
nested `$id` stops the build, since neither the rewrite nor the reference check models a second base URI and troupe has
none (refuse rather than guess; lift it when a schema needs one); and every absolute reference under
`https://troupe.run/protocol/` is the unversioned URL of a file at that ref. All of a ref's problems are reported
together, as `refuse` does for docs pages.

### D6. The schemas are written into `public/protocol/`

The sync writes the copies into `public/protocol/`, gitignored, with the same marker-file rule as
`src/content/docs/docs/` (it replaces only a folder it wrote). Astro copies `public/` into the build and serves it in
dev, so `/protocol/` works in `astro dev`, `astro build` and the fixture build with no route code, and every file keeps
its `.json` extension, which is what gives it its content type on Pages.

*Alternatives:* an Astro endpoint (`src/pages/protocol/[...path].ts`) with `getStaticPaths`, which works but is route
code for what are static files, and has to fight `trailingSlash: 'always'` on paths that end in `.json`; or writing into
`dist/` in `astro:build:done`, which `astro dev` never runs.

### D7. The reference check is a second pass of the link check

`scripts/linkcheck.mjs <dir>` also walks `<dir>/protocol/**/*.schema.json`. It resolves each `$ref` and `$dynamicRef`
against the file's own URL (its `$id`, which D5 and D4 make equal to where it's served), and for a target under
`https://troupe.run/protocol/` checks: the file exists in `<dir>`; a fragment starting `/` is a JSON Pointer (with `~0`,
`~1` and percent-decoding) that leads to a value; any other fragment is a plain name that an `$anchor` or
`$dynamicAnchor` in that file declares. A target outside troupe.run (the meta-schema) is skipped, and counted, so the
summary says what was checked. It fails naming the file, the reference and the reason, and fails if it checked no
reference at all, as the HTML check does when it scans nothing. Because `check.py` and the deploy already run
`npm run linkcheck` on each build, nothing else changes.

*Alternative:* a separate `npm run schemacheck` gate. Rejected: it means a `check.py` step and a deploy step, where
deploy.yml is guarded by a unit test, for no extra safety.

### D8. The page at `/protocol/` is the site's own, like `/status/`

`src/content/docs/protocol.md` (slug `protocol`) holds the words, reviewed by the owner before they ship. The release
list is filled in at build time from the manifest, by an mdast plugin at a marker comment, as `/status/`'s list is; its
fixed phrases ("no protocol release yet", "latest") live in `src/content/copy/protocol.md`. The existing route
middleware already gives a page outside `/docs` that the sidebar doesn't link no sidebar and no Previous/Next, and the
header shows no version menu outside `/docs`. The page links nothing under `/protocol/` that isn't a file (copies have
no index page), so linkinator finds no broken directory link. Its pagefind entry stays on.

### D9. The fixture troupe gets protocol steps without moving the docs' dates

A fixture step folder may hold `protocol/` as well as `docs/`; each folder it holds replaces that folder in the
fixture repository, and one it doesn't hold carries over from the step before. A step's name may carry several tags
joined by `+`, so the four commits, and the dates the `/status/` tests read, stay as they are:

| Step | Docs tag | Protocol tag | Protocol change |
|---|---|---|---|
| 1 | `troupe-v0.1.0` | `protocol-v0.1.0` | the first schemas |
| 2 | `troupe-v0.1.1` | `protocol-v0.2.0` | a definition added |
| 3 | `troupe-v0.2.0` | `protocol-v1.0.0` | a breaking rename |
| 4 | `main` | | a schema changed after the last tag |

The fixture's schemas are a small closed set copied verbatim from troupe's `main` (named in the fixture README with
the commit), with at least one `$dynamicRef`, one cross-folder `$ref` with a pointer, and one absolute reference, so
every branch of D4 and D7 runs. The unit tests build their own throwaway repositories for the refusals.

## Risks / Trade-offs

- **[A tag deleted by hand sends no notice]** → its copy stays served until the next deploy, which any push to troupe's
  `main` or this repository's starts. The owner can also run the deploy by hand. Tags are never moved or deleted in
  troupe's release process (contributing/releasing.md), so this is an exception path.
- **[A troupe change that breaks a check stops every deploy, `/docs` included]** → that's the existing rule for docs
  pages too, and each error names the file and the fix in troupe. `TROUPE_DOCS` lets troupe's authors run the site's
  build on their branch before merging.
- **[Duplicate keys in a schema]** → `JSON.parse` keeps the last, silently, as Python's `json` does. Accepted:
  troupe's tests read the files with the same rule, so both sides agree on what a file means.
- **[A published release changes when its tag is recreated]** → deliberate (owner, 2026-10-21: keeping the site and the
  tags in step matters more than keeping a published version unchanged).
- **[Major copies change under people]** → `/protocol/0/` moves with every 0.x release, and before 1.0 a minor can
  break. That's what the issue's table asks for; anyone who needs stability pins `/protocol/X.Y.Z/`, and the page says
  so.

## Migration Plan

Nothing to migrate: `/protocol/` serves nothing today. The first deploy after merging publishes `main`'s schemas at
`/protocol/`, `/protocol/0/` and `/protocol/next/`. Verify after it with `curl -sI` on
`https://troupe.run/protocol/0/config/actor.schema.json` (200, `application/json`). Rolling back is reverting the
merge; the next deploy removes `/protocol/`.

## Open Questions

- **Linking the page:** the docs sidebar doesn't link `/protocol/` in this change. troupe's `docs/prompt-book/
  config-schema.md` names the schema URL already; whether the docs link the page is troupe's to decide, in its docs.
