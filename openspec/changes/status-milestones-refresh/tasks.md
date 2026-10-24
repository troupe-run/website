# Tasks

## 1. The rebuild test, failing on main

- [x] 1.1 Install dependencies in this worktree (`npm ci`). Then run `npm run test:unit` and `npm run build:fixture` on
  the unchanged tree to record the baseline. Verify: both pass before any edit, and the unit test count and fixture
  build time are recorded here.
  Done 2026-10-24: on fe45b8c, 430 unit tests in 33 files pass; `npm run build:fixture` passes in 7.2s.
- [x] 1.2 Write `scripts/rebuild-test.mjs` and `npm run test:rebuild`, as design D3 describes. It does a seed build,
  then a milestones-only rebuild (a variant made in code from `tests/fixtures/milestones.json`, with one milestone
  renumbered and one re-described), then a tags-only rebuild (`troupe-v0.2.1` and the next protocol patch tag, added
  to the fixture repository). Each rebuild goes into one temporary `--outDir`. Each rebuild's assertions name the page
  and the data expected. Each rebuild also fails if its log shows the store was cleared or the config changed. Clean
  up in `finally` (D4). Verify: on the unchanged plugins and loader, `npm run test:rebuild` fails on the
  milestones-only rebuild, naming `/status/`. With that rebuild's assertions skipped by hand, it also fails on the
  tags-only rebuild, naming the status line and `/protocol/`. Neither failure is the cache-reuse check, and the output
  of both runs is recorded here. If the cache-reuse check fires instead, find which config input changed before going
  on (design Risks).
  Done 2026-10-24: the test reports every failed assertion, not only the first, so one run shows both rebuilds and no
  assertions had to be skipped by hand. On the unchanged loader it fails with 3 of 6 assertions, and the cache-reuse
  check passes on both rebuilds:
  - rebuild 1: Milestones still list 0.3.0 "Three: planned, …", 0.10.0, 1.0.0 (the seed's render);
  - rebuild 2: the status line still says "The latest release is 0.2.0";
  - rebuild 2: /protocol/ still lists 1.0.0 (latest), 0.2.0, 0.1.0.
  Rebuild 2's "Milestones back to the fixture's" passes on main only because the stale render is the seed's; after
  the fix it checks that reverting re-renders. The tags are made with the fixture's isolated git (`ENV`, now
  exported from `troupe-fixture.mjs`): the machine's git config made `git tag` ask for a message.
- [x] 1.3 Make the clean-up checkable. After a run that passes and one that fails, there's no
  `troupe-fixture-*`/`milestones-fixture-*` folder left in the temp directory, and no output folder. `dist/` and
  `dist-fixture/` are unchanged (compare their file lists and `dist-fixture/troupe-docs.json` before and after).
  Verify: the comparison's output is recorded here.
  Done 2026-10-24: the snapshot is a hash over every file in `dist/` and `dist-fixture/`, a hash of
  `dist-fixture/troupe-docs.json`, and the temp directory's `troupe-fixture-*`, `milestones-fixture-*` and
  `rebuild-test-*` entries. It's identical before and after a failing run (unchanged loader, exit 1) and a passing run
  (after 2.2, exit 0): `8328a21c…` and `fa0d81b9…`. The one temp entry, `troupe-fixture-bUYFUf`, dates from 2026-10-20
  and was there before both runs.

## 2. Generated pages are rendered again when their inputs change

- [x] 2.1 Add `scripts/generated-pages.mjs` (design D2). It's the table of pages rendered from generated data, each
  with its path, `load(root)` and plugin factory: `status.md` with `loadRoadmapInputs` and `roadmapPlugin`, and
  `protocol.md` with `loadProtocolInputs` and `protocolPlugin`. It also exports the loader wrapper (D1) that
  digests each entry's inputs. When a digest differs from the one in `meta`, the wrapper deletes the entry whose
  `filePath` is the page, then calls the wrapped loader. Unit tests under `tests/unit/`, with a fake loader context
  (`store`, `meta`, `config.root`, `generateDigest`), check that:
  - an unchanged input keeps the stored entry;
  - a changed roadmap, protocol release list or copy file deletes only its own page's entry;
  - a page with no stored entry deletes nothing;
  - a changed digest is recorded;
  - the wrapped loader is always called, after any delete;
  - a missing `src/generated/` file stops the load, naming the file;
  - each table entry's page exists in the repository.

  Verify: the new tests pass, and each one fails with the delete or the record removed from the wrapper.
  Done 2026-10-24: `tests/unit/generated-pages.test.ts`, 10 tests, pass. It also checks that a change to
  `troupe-docs.json` outside its protocol releases keeps /protocol/. With the delete removed, 4 fail; with the record
  removed, 6 fail; with the wrapped loader called first, 5 fail. Every test of deleting, recording or order fails under
  one of those mutations. Three tests check things no mutation of those touches (the name is kept, a missing input
  stops the load naming the file, and the table's pages exist), so "each one" in the task overclaims for them. The
  order test first checked `every` over the deletes, which passed vacuously with none, and now asserts the exact
  sequence.
- [x] 2.2 Wire it in. `src/content.config.ts`'s docs collection uses the wrapper around `docsLoader()`.
  `astro.config.mjs` registers the page plugins from the table in place of the two written-out calls, and its comments
  name the table. Verify: `npm run check` has no errors, and `npm run test:unit` passes with the 1.1 count plus the new
  tests. `npm run test:rebuild` passes on all three builds, and the cache-reuse check passes on both rebuilds. Record
  the output, and the test's time against one fixture build.
  Done 2026-10-24: `npm run check` has 0 errors. 440 unit tests in 34 files pass (430 plus 10). `npm run test:rebuild`
  exits 0: "/status/ and /protocol/ followed their sources on both rebuilds", with no cache-reuse failure. It takes
  17.7s against 7.2s for one fixture build. The wrapper's JSDoc first used a template type, which gave the test's
  zero-argument inner loader 16 `astro check` errors; it now takes and returns a plain loader shape.
- [x] 2.3 Check the local preview case in the roadmap delta ("Previewing a milestone edit twice"). Build with
  `TROUPE_MILESTONES` set to a temporary copy of the fixture milestones, edit one description, then build again.
  Verify: the second `dist/status/index.html` has the edited description, and with the 2.2 wiring reverted it has the
  old one. Record both.
  Done 2026-10-24: with the fix, the second build's /status/ has "0.3.0 Three: edited in the checkout". With
  `src/content.config.ts` back on a bare `docsLoader()`, it has "0.3.0 Three: planned, with no tag in the fixture
  troupe", the first build's render. Neither second build logged "Clearing content store".

## 3. The check runs it

- [x] 3.1 Add the `rebuild test` gate to `scripts/check.py` after `fixture build`, as `npm run test:rebuild`, with a
  comment naming the issue and the spec. Update `scripts/tests/test_check.py`'s expected gate list and commands.
  Verify: `uv run python -m unittest discover -s scripts/tests` passes.
  Done 2026-10-24: 19 tests pass. CONTRIBUTING.md's list of the check's gates names the rebuild test, and a bullet
  says what it does.
- [ ] 3.2 Run the full check, `uv run scripts/check.py` (the agent workaround for local e2e is in memory). Verify: it
  ends `check: all gates passed`, with the rebuild test gate reported passed and its time. Record it here.

## Workflow follow-up

- Open the pull request with `Closes #35`, and wait for CI's `test` job to pass.
- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- After the merge: confirm on the next deploy that `/status/` matches infrastructure's `tofu/milestones.json`. The
  first deploy records the digests and re-renders both pages once (design Migration Plan). Comment on #35 with the
  pull request, the archived change and that deploy's run, then check the issue is closed and its roadmap card says
  Done.
