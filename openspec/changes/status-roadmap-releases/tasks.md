# Tasks

## 1. Before the code

- [x] 1.1 Show the owner, as text, the draft of `status.md` (Status, Releases, How to read it) and of
  `src/content/copy/roadmap.md` (the status line before and after the first release, and "Released" with its date),
  with the list rendered as it will read. Verify: the owner agrees the words in this session, recorded here with the
  date. Later tasks write exactly the agreed text.
  Done 2026-10-23: the owner dropped the "Working on now" mark and the status line's "Work is on {next}" ("just show
  the version roadmap"), and asked for a release's date once it's out. The rest of the draft stands, with "How to read
  it" saying only a release that's out has a date. The spec, design and tasks were updated to match before any code.
- [x] 1.2 Open an issue in troupe-run/infrastructure (with `--project "troupe roadmap"`): dispatch troupe-run/website's
  Deploy when `tofu/milestones.json` changes on `main`, as troupe's release workflow does after every push. Link it
  from #32. Verify: `gh issue view <n> -R troupe-run/infrastructure --json projectItems` shows it on the board.
  Done 2026-10-23: troupe-run/infrastructure#124, on the board (Todo), linked from #32.
- [x] 1.3 Open an issue in troupe-run/infrastructure (with `--project "troupe roadmap"`): check `tofu/milestones.json`
  in its pull requests against the rules this site's build enforces (D4: every title `MAJOR.MINOR.PATCH` with no
  leading zeros, titles unique, every description non-empty), so a bad edit fails there before it can stop this site's
  deploys. Today its plan catches only invalid JSON. Name D4 as the rules' source, so the two stay in step. Link it
  from #32. Verify: it's on the board, as in 1.2.
  Done 2026-10-23: troupe-run/infrastructure#125, on the board (Todo), linked from #32.
- [x] 1.4 Add character and direction to the brand guide's §6 table, both "In use, 2026-10-22" (owner, 2026-10-23,
  folded into this change). Verify: `npx vitest run tests/unit/vocabulary.test.ts` passes; it failed before.
  Done 2026-10-23: it failed on "character" and "direction" before the rows, and passes (13) after.

## 2. The milestones reader (D1 to D4, D8)

- [x] 2.1 Tests first, in `tests/unit/roadmap.test.ts`, for a pure reader beside `scripts/troupe-docs-lib.mjs`: given
  the file's text and a list of release tags, it returns the releases in version order (0.2.0 before 0.10.0, 1.0.0
  last), each `released` when its exact tag exists (`troupe-v0.1.1` adds nothing), and the first unreleased as current
  (null when all are released). It refuses, naming `tofu/milestones.json`, the milestone and the fix: not JSON, no
  `milestones` array, a non-object milestone, a title like `v0.3`, `0.03.0` or `0.3`, an empty or missing description,
  a duplicate title. It ignores `key`, `state` and an unknown key. Verify: the tests fail before the reader exists,
  and `npx vitest run tests/unit/roadmap.test.ts` passes after.
- [x] 2.2 The source: a shallow bare clone of troupe-run/infrastructure's `main` in `.cache/infrastructure.git`,
  fetched every run, or `TROUPE_MILESTONES`'s working tree. Tests first, as `tests/unit/troupe-source.test.ts` does
  for `TROUPE_DOCS`: empty value, missing folder, folder with no `tofu/milestones.json` each refuse naming the
  variable and value; a local checkout's uncommitted edit is read; an unreachable remote refuses naming
  troupe-run/infrastructure, the git error and `TROUPE_MILESTONES`. Document `TROUPE_MILESTONES` in CONTRIBUTING.md
  beside `TROUPE_DOCS`. Verify: the tests pass, and `TROUPE_MILESTONES=../infrastructure npm run docs:sync` (with
  infrastructure checked out there) reads the local file.
  Done 2026-10-23: 10 tests in `tests/unit/roadmap-source.test.ts` pass (they failed before `readMilestones` existed).
  `TROUPE_MILESTONES=../infrastructure npm run docs:sync` lists 21 releases, the same text as the remote's; set to a
  missing folder it stops, naming the variable, the value and the fix. CONTRIBUTING.md documents it.
- [x] 2.3 Add the release tags to the docs manifest, and in the `troupe-docs` integration run the reader after
  `sync()`, writing `src/generated/roadmap.json` (and from `npm run docs:sync` too). Verify: a unit test that the
  manifest's tags are the tags the versions were chosen from; after `npm run docs:sync`, `src/generated/roadmap.json`
  lists 21 releases from 0.1.0 to 1.0.0 with 0.1.0 current.
  Done 2026-10-23: the manifest test passes (a non-release tag is left out), as do 2 `syncRoadmap` tests. After
  `npm run docs:sync`, `src/generated/roadmap.json` has 21 releases, 0.1.0 to 1.0.0, current 0.1.0, latest null.
- [x] 2.4 Measure the build's added time from the second clone, cold and warm cache. Verify: the two timings are
  recorded in this task; if the cold clone adds more than about 10 seconds, raise it with the owner before going on.
  Done 2026-10-23: cold (no `.cache/infrastructure.git`) 1.6 s, warm 1.2 s, on this machine.

- [x] 2.5 Date each release from its tag, and drop "current" (D2, owner 2026-10-23): the manifest's release tags carry
  each tag's date, a released milestone's `released` is that date as `YYYY-MM-DD` instead of `true`, and the reader
  returns no `current`. Tests first in `tests/unit/roadmap.test.ts`, `roadmap-source.test.ts` and
  `troupe-sync.test.ts`, including an annotated tag (its tagger date) and a lightweight one (its commit date). Verify:
  they fail on the code from 2.1 to 2.3 and pass after, and after `npm run docs:sync` `src/generated/roadmap.json` has
  no `current` key. (2.1 and 2.3 above are recorded as they were done, with "current".)
  Done 2026-10-23: 12 tests failed on the earlier code and pass after (352 unit tests in all). git writes a UTC date
  with `Z`, which the tests first expected as `+00:00`; the code was right. `src/generated/roadmap.json` now has only
  `releases` and `latest`.

## 3. Rendering into status.md (D5, D6)

- [x] 3.1 Prove the plugin mechanism first: a Sätteri mdast plugin that replaces an `html` node whose value is exactly
  `<!-- roadmap:releases -->` with an ordered list, on a test page. Verify: a unit test runs the plugin through Sätteri
  and the output HTML has the `<ol>` and no comment. If `html` nodes or `replaceNode` don't behave, switch to the
  fallback marker in D5 and update design.md before going on.
  Done 2026-10-23: a throwaway test ran a plugin through `createSatteriMarkdownProcessor`; `## Releases`, the marker
  and a paragraph rendered with an `<ol>` in place of the marker and no comment left. Its case moves into task 3.3's
  tests, so the throwaway file is gone. No fallback needed.
- [x] 3.2 Add `src/content/copy/roadmap.md` with the agreed words (task 1.1) and a `roadmap` section in the `copy`
  collection's schema in `src/content.config.ts`. Verify: `npm run check` passes, and fails when a key is removed
  from the file.
  Done 2026-10-23: `npm run check` has 0 errors. With `releasedOn` removed, `astro build` stops with
  "copy → roadmap data does not match collection schema. releasedOn: Required" (`astro check` doesn't load content,
  so the build is where it fails); restored. The words: "Pre-alpha. Nothing has been released yet.", "Pre-alpha. The
  latest release is {latest}.", "Released {date}".
- [x] 3.3 The `roadmap` plugin, tests first: active for `src/content/docs/status.md` only; `roadmap:status` becomes
  the status line from the copy (before and after the first release); `roadmap:releases` becomes the list, each item
  the version in bold, the description verbatim and, for a release that's out, "Released" and its date in a `<time>`; a missing, repeated or
  unknown `roadmap:` marker fails naming the page and the marker. Add it to the processor's plugins in
  `astro.config.mjs` beside `troupe-links`, and style the marker words in `src/styles/starlight.css` from tokens only.
  Verify: `npx vitest run tests/unit` passes, and `tests/unit/token-discipline.test.ts` still passes.
  Done 2026-10-23: 10 tests in `tests/unit/roadmap-plugin.test.ts`, including 3.1's case, pass; 362 unit tests in
  all, token discipline among them. A tight list renders each item without a `<p>`, and a description stays literal
  text (`*keep*` isn't emphasis, `<runs>` is escaped). Each marker is one comment that also says where its content
  comes from, so status.md needs no second comment. The date is teal's text shade.
- [x] 3.4 Rewrite `src/content/docs/status.md` with the agreed text (task 1.1), the two markers, and beside each a
  comment saying its content comes from `tofu/milestones.json` in troupe-run/infrastructure. Update its frontmatter
  description if task 1.1 changed it. Verify: `npm run build` succeeds, `dist/status/index.html` holds 21 list items in
  version order with no date on any (troupe has no release yet), "On this page" lists the page's headings, and
  `tests/unit/vocabulary.test.ts` and `tests/unit/descriptions.test.ts` pass.
  Done 2026-10-23: `astro build` writes `/status/` with 21 items, 0.1.0 to 1.0.0 in order, no date (troupe has no
  release yet), "Pre-alpha. Nothing has been released yet.", no marker left, and Status, Releases and How to read
  it in "On this page". The vocabulary check flagged "projects" in the board's URL; it's recorded in `PROJECT_USES`
  as GitHub's URL. Both tests pass.

## 4. Fixture and end-to-end tests (D9, spec scenarios)

- [ ] 4.1 Add `tests/fixtures/milestones.json` (wrong order, a 0.10.0, an unknown key), and have
  `scripts/troupe-fixture.mjs` put it in a temporary `tofu/` folder, set `TROUPE_MILESTONES` to it, and remove it
  afterwards. Verify: `tests/unit/troupe-fixture.test.ts` gains a test that nothing is left behind and passes, and
  after `npm run build:fixture`, `dist-fixture/status/index.html` lists the fixture releases in version order.
- [ ] 4.2 In `tests/e2e/status.spec.ts`, tests named for what they check:
  - every build: the releases are an ordered list in version order, and the page links to troupe's milestones and
    the roadmap board, with no count, percentage, progress mark or date beside any release that isn't out;
  - the fixture build (`tests/e2e/versions.spec.ts`, or the fixture project): 0.1.0 and 0.2.0 show "Released" with
    their tags' dates, 0.3.0 has no date, there's no 0.1.1 entry, and the status line names 0.2.0 as the latest
    release.

  Verify: they pass on both builds, and the fixture tests fail when the plugin ignores the tags (shown by running them
  with the `released` check removed).

## 5. Review and integration

- [ ] 5.1 Build the site and show the owner `/status/` at 320px, 768px and 1280px, in light and dark. Verify: the
  owner agrees the layout in this session, recorded here with the date.
- [ ] 5.2 Ask the owner whether any milestone description should be reworded in troupe-run/infrastructure (for
  instance "config" and "worktree", which the site's copy avoids). Verify: their answer is recorded here, and any
  rewording is an issue in infrastructure on the board, not an edit here.
- [ ] 5.3 Run `uv run scripts/check.py` on the final tree. Verify: every gate passes, axe on `/status/` in light and
  dark among them. Save the output to the scratchpad.
- [ ] 5.4 Open the pull request with `Closes #32` (body via `--body-file`). Verify: CI's `test` and `guard` jobs pass.

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- Check #32 is closed and its card on the troupe roadmap says Done. Comment on #32 with the pull request and the
  archived change.
