# Tasks

## 1. The rebuild test, failing on main

- [ ] 1.1 Install dependencies in this worktree (`npm ci`). Then run `npm run test:unit` and `npm run build:fixture` on
  the unchanged tree to record the baseline. Verify: both pass before any edit, and the unit test count and fixture
  build time are recorded here.
- [ ] 1.2 Write `scripts/rebuild-test.mjs` and `npm run test:rebuild`, as design D3 describes. It does a seed build,
  then a milestones-only rebuild (a variant made in code from `tests/fixtures/milestones.json`, with one milestone
  renumbered and one re-described), then a tags-only rebuild (`troupe-v0.2.1` and the next protocol patch tag, added
  to the fixture repository). Each rebuild goes into one temporary `--outDir`. Each rebuild's assertions name the page
  and the data expected. Each rebuild also fails if its log shows the store was cleared or the config changed. Clean
  up in `finally` (D4). Verify: on the unchanged plugins and loader, `npm run test:rebuild` fails on the
  milestones-only rebuild, naming `/status/`. With that rebuild's assertions skipped by hand, it also fails on the
  tags-only rebuild, naming the status line and `/protocol/`. Neither failure is the cache-reuse check, and the output
  of both runs is recorded here. If the cache-reuse check fires instead, find which config input changed before going
  on (design Risks).
- [ ] 1.3 Make the clean-up checkable. After a run that passes and one that fails, there's no
  `troupe-fixture-*`/`milestones-fixture-*` folder left in the temp directory, and no output folder. `dist/` and
  `dist-fixture/` are unchanged (compare their file lists and `dist-fixture/troupe-docs.json` before and after).
  Verify: the comparison's output is recorded here.

## 2. Generated pages are rendered again when their inputs change

- [ ] 2.1 Add `scripts/generated-pages.mjs` (design D2). It's the table of pages rendered from generated data, each
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
- [ ] 2.2 Wire it in. `src/content.config.ts`'s docs collection uses the wrapper around `docsLoader()`.
  `astro.config.mjs` registers the page plugins from the table in place of the two written-out calls, and its comments
  name the table. Verify: `npm run check` has no errors, and `npm run test:unit` passes with the 1.1 count plus the new
  tests. `npm run test:rebuild` passes on all three builds, and the cache-reuse check passes on both rebuilds. Record
  the output, and the test's time against one fixture build.
- [ ] 2.3 Check the local preview case in the roadmap delta ("Previewing a milestone edit twice"). Build with
  `TROUPE_MILESTONES` set to a temporary copy of the fixture milestones, edit one description, then build again.
  Verify: the second `dist/status/index.html` has the edited description, and with the 2.2 wiring reverted it has the
  old one. Record both.

## 3. The check runs it

- [ ] 3.1 Add the `rebuild test` gate to `scripts/check.py` after `fixture build`, as `npm run test:rebuild`, with a
  comment naming the issue and the spec. Update `scripts/tests/test_check.py`'s expected gate list and commands.
  Verify: `uv run python -m unittest discover -s scripts/tests` passes.
- [ ] 3.2 Run the full check, `uv run scripts/check.py` (the agent workaround for local e2e is in memory). Verify: it
  ends `check: all gates passed`, with the rebuild test gate reported passed and its time. Record it here.

## Workflow follow-up

- Open the pull request with `Closes #35`, and wait for CI's `test` job to pass.
- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- After the merge: confirm on the next deploy that `/status/` matches infrastructure's `tofu/milestones.json`. The
  first deploy records the digests and re-renders both pages once (design Migration Plan). Comment on #35 with the
  pull request, the archived change and that deploy's run, then check the issue is closed and its roadmap card says
  Done.
