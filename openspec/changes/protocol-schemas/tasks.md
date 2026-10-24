# Tasks

## 1. Before the code

- [x] 1.1 Ask the owner design D3's question: does `/protocol/0/` serve troupe's `main` before the first protocol
  release? Verify: their answer is recorded here with the date. If it's no, update the spec's "Each major version has a
  copy", D2 and D3 to match before task 3.1.
  Done 2026-10-24: the owner chose to serve `main` at `/protocol/0/` before the first protocol release, as D3
  recommends. The spec, D2 and D3 stand.
- [x] 1.2 Show the owner, as text, the draft of `src/content/docs/protocol.md` (what the schemas are, the four paths and
  when to use each, the release list) and of `src/content/copy/protocol.md` (the list's phrases before and after the
  first protocol release, and "latest"), with the list rendered as it will read in both states. Verify: the owner
  agrees the words in this session, recorded here with the date. Later tasks write exactly the agreed text.
  Done 2026-10-24: the owner agreed the draft as written: the intro, "Which URL to use" (the four rows), the
  before-1.0 note, the `$id` line, "Releases" ("No protocol release yet. Until there is one, /protocol/ and
  /protocol/0/ serve troupe's unreleased main." before; "0.2.0 (latest), at /protocol/0.2.0/" and "0.1.0, at
  /protocol/0.1.0/" after) and "What each schema defines", linking troupe's protocol README.
- [x] 1.3 Prove D6 before anything depends on it: with a hand-made `public/protocol/next/x.schema.json` and a page at
  `src/content/docs/protocol.md`, `astro build` writes both `dist/protocol/index.html` and
  `dist/protocol/next/x.schema.json`, `astro dev` serves both, and `astro preview` serves the file as
  `application/json` (`curl -sI`). Verify: the three outputs, saved to the scratchpad; then remove the hand-made files.
  Done 2026-10-24: the build wrote `dist/protocol/index.html` and `dist/protocol/next/x.schema.json`; preview served
  the file 200 `application/json` and the page 200 `text/html`; dev served both the same. Output in the scratchpad
  (`d6-build.log`, `d6-preview.txt`, `d6-dev.txt`); the hand-made files are removed.

## 2. The source reads any folder (D1)

- [x] 2.1 Tests first, in `tests/unit/troupe-source.test.ts`: the source lists and reads `protocol/schemas/` at a tag
  and at `main`, from a cloned repository and from a `TROUPE_DOCS` checkout, where `main` is the working tree with an
  uncommitted schema edit included. Then generalise `Source` with `listTree(ref, dir)` and `readFile(ref, path)`,
  keeping `list` and `read` as wrappers over them. Verify: the new tests fail before the change, and
  `npx vitest run tests/unit/troupe-source.test.ts` passes after, with every existing test unchanged.

## 3. Choosing the copies (D2, D3)

- [x] 3.1 Tests first, in `tests/unit/protocol-copies.test.ts`, for a pure function beside `chooseVersions`: no tag
  gives latest, `0/` and `next/` from `main`; `protocol-v0.2.1` and `protocol-v0.10.0` give latest from 0.10.0 (not
  0.2.1), `0/` from 0.10.0, `next/` from `main` and one copy per tag; `protocol-v0.4.2` and `protocol-v1.0.0` give `0/`
  from 0.4.2 and `1/` from 1.0.0; `troupe-v*` tags are ignored; `protocol-v1.0.0-rc.1`, `protocol-v01.0.0` and
  `protocol-v1.0` refuse, naming the tag and `protocol-vMAJOR.MINOR.PATCH`; the latest copy alone isn't rewritten.
  Verify: the tests fail before the function exists, and pass after.

## 4. Checking and rewriting a ref's schemas (D4, D5)

- [x] 4.1 Tests first, in `tests/unit/protocol-schemas.test.ts`, for the per-ref check. Each refuses naming the ref,
  the path and the fix, and all of a ref's problems are reported together: a file not named `*.schema.json`; a file
  that isn't JSON (the parser's error quoted); JSON that isn't an object; a top-level folder `next`, `0` or `0.2.1`; a
  missing `$id`; an `$id` of another file (found and expected named); a nested `$id`; an absolute reference naming a
  major version, `next`, or a file that isn't at that ref (with the fix to use the unversioned URL or a relative
  reference); and a ref with no `protocol/schemas/`. Verify: the tests fail first, then pass.
- [x] 4.2 Tests first, in the same file, for the rewrite: in a `0/` copy the `$id` and an absolute `$ref` with a
  fragment move under `/protocol/0/`; a relative `$ref`, a `$dynamicRef` of `#runnerOptions`, a `description` holding a
  versioned URL, and `$id`/`$ref` keys inside `const`, `enum`, `examples` and `default` are left as written; the latest
  copy's values are unchanged; and apart from the rewritten values, each output parses to the same JSON value as its
  input (a property test over the real schemas from troupe's `main`, copied as a fixture). Verify: the tests fail
  first, then pass.

## 5. Writing the copies (D1, D6)

- [x] 5.1 Tests first, in `tests/unit/protocol-sync.test.ts`, over a throwaway troupe repository: `sync` writes each
  copy under `public/protocol/` with a marker file; a second run after a tag is deleted leaves no folder for it; a run
  refuses to clear a `public/protocol/` it didn't write, naming the folder; the manifest's `protocol` entry lists the
  copies and the releases newest first; one source is opened per run (the clone is fetched once). Then wire it into
  `sync`, `npm run docs:sync`'s log line (`/protocol/ has N copies, the latest from <ref>`) and the integration in
  `astro.config.mjs`, and add `public/protocol/` to `.gitignore` with a comment like the docs folder's. Verify: the
  tests pass; `npm run docs:sync` against troupe-run/troupe writes `public/protocol/`, `public/protocol/0/` and
  `public/protocol/next/`, each with 46 files today; `git status` shows none of them.

## 6. The reference check (D7)

- [x] 6.1 Tests first, in `tests/unit/schema-refs.test.ts`, for a pure checker over a folder of published copies:
  passes on a pointer into another file's `$defs`, `#`, a `$dynamicRef` with a matching `$dynamicAnchor`, an `$anchor`,
  a pointer with `~1` and a percent-encoded character; fails naming the file, the reference and the reason on a missing
  file, a pointer that leads nowhere, an undeclared anchor, and a reference from one copy into another; skips and counts
  a reference outside troupe.run; fails when it checked no reference. Then call it from `scripts/linkcheck.mjs`, after
  the HTML check, with its own summary line. Verify: the tests fail first, then pass; `npm run build && npm run
  linkcheck` passes on the real build, and fails naming the file when a `$defs` entry is deleted by hand from a copy in
  `dist/protocol/`.

## 7. The fixture troupe (D9)

- [x] 7.1 Extend `scripts/troupe-fixture.mjs`: a step may hold `protocol/` as well as `docs/`, each replacing only its
  own folder, and its name may carry several tags joined by `+`. Rename the steps to `1-troupe-v0.1.0+protocol-v0.1.0`,
  `2-troupe-v0.1.1+protocol-v0.2.0`, `3-troupe-v0.2.0+protocol-v1.0.0` and `4-main`, and add their schemas: a small
  closed set copied verbatim from troupe's `main` at 30402fa, with a `$dynamicRef`, a cross-folder `$ref` with a pointer
  and one absolute reference, a definition added at 0.2.0, a breaking rename at 1.0.0, and a change on `main`. Update
  the fixture README. Verify: `tests/unit/troupe-fixture.test.ts` gains tests for the carry-over and the `+` tags and
  passes; the existing docs and `/status/` tests pass with their dates unchanged.

## 8. The page at /protocol/ (D8)

- [x] 8.1 Write `src/content/docs/protocol.md` and `src/content/copy/protocol.md` with exactly the words agreed in 1.2,
  and the mdast plugin that fills the release list at its marker from the manifest, with unit tests for both states
  (none yet; several, newest first, the latest named). Verify: `npx vitest run` passes; the built page shows the words
  in both the live and fixture builds.
  Done 2026-10-24: `scripts/protocol-plugin.mjs`, with 4 tests in `tests/unit/protocol-plugin.test.ts`. The copy's
  paths and `main` are in backticks, shown as code as `/status/`'s are; the words are the agreed ones. The live build
  shows "No protocol release yet…", the fixture build lists 1.0.0 (latest), 0.2.0 and 0.1.0.
- [x] 8.2 E2E tests, in `tests/e2e/protocol.spec.ts`: on the live build, `/protocol/` has no left-hand sidebar and no
  version menu, says there's no protocol release yet, and `/protocol/config/actor.schema.json`,
  `/protocol/0/config/actor.schema.json` and `/protocol/next/config/actor.schema.json` respond 200 with
  `application/json` and each copy's own `$id`. On the fixture build: the latest is 1.0.0's schemas, `/protocol/0/` is
  0.2.0's, `/protocol/1/` is 1.0.0's, `/protocol/next/` has `main`'s change, each tag's copy exists with its own ids,
  and the page lists 1.0.0, 0.2.0 and 0.1.0. axe on `/protocol/` in light and dark reports no serious or critical
  violation. Verify: the tests pass on both builds, and one fails when the rewrite is turned off for `0/`.
  Done 2026-10-24: the live tests are in `tests/e2e/protocol.spec.ts`; the fixture's are a describe block in
  `tests/e2e/versions.spec.ts`, the one file the fixture build's Playwright project serves, as the roadmap's fixture
  tests are. `/protocol/` is in `a11y.spec.ts`'s pages, light and dark. They also check that a major or release with
  no tag gives 404 and the sync's marker isn't served. 74 tests passed. Turning the rewrite off for the majors showed
  that `writeProtocol` ignored the copy's `rewrite` flag (it rewrote by prefix alone); it now honours it, with a unit
  test. With the flag off, the `0/` and `1/` tests failed, and so did the reference check.
- [x] 8.3 Build the site and show the owner `/protocol/` at 320px, 768px and 1280px, in light and dark, live and
  fixture. Verify: the owner agrees the page in this session, recorded here with the date.
  Done 2026-10-24: the first build's 320px view showed the URL table scrolling sideways inside itself, with only the
  URL column on screen, and the copy's straight apostrophe beside the Markdown's curly ones. The owner chose a list
  for "Which URL to use" (each entry: the URL, "Serves: …", "Use it for: …", the agreed words), and the copy now uses
  a curly apostrophe. The owner then agreed the page at 320px, 768px and 1280px, light and dark, live and fixture. No
  width scrolls sideways; the two long example URLs wrap mid-word at 320px.

## 9. Documentation

- [x] 9.1 Say where `/protocol/` comes from: CLAUDE.md's first paragraph and `openspec/config.yaml`'s context (the
  schemas live in troupe's `protocol/schemas/`, never here), CONTRIBUTING.md's `TROUPE_DOCS` section (it supplies the
  schemas too), and the comments at the top of `scripts/troupe-docs.mjs` and the integration. Check
  `scripts/check-paths.toml` covers the new paths. Verify: `uv run scripts/check.py` passes, and a grep for
  `protocol` in each file shows the line.
  Done 2026-10-24: each file names `/protocol/` (grep counts: CLAUDE.md 2, config.yaml 2, CONTRIBUTING.md 5,
  troupe-docs.mjs 4, astro.config.mjs 6). check-paths.toml needs no change: `public/protocol/` is git-ignored and
  every new file is read by a gate. The three edited files are on its skip list; the full check last passed on the
  code at the `feat(linkcheck)` commit, and 10.1 runs it again on the final tree.

## 10. Final checks

- [ ] 10.1 Run `uv run scripts/check.py` on the final tree. Verify: every gate passes, the reference check on both
  builds and axe on `/protocol/` among them. Save the output to the scratchpad.
- [ ] 10.2 Open the pull request with `Closes #30` (body via `--body-file`). Verify: CI's `test` and `guard` jobs
  pass.

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- After the deploy, check `curl -sI https://troupe.run/protocol/0/config/actor.schema.json` gives 200 and
  `application/json`.
- Check #30 is closed and its card on the troupe roadmap says Done. Comment on #30 with the pull request and the
  archived change.
