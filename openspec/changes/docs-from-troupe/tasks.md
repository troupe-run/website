# Tasks

## 1. Prove Starlight's per-page fields and route data (design Context, Risks)

- [x] 1.1 On a scratch branch that isn't committed, give one existing page front matter with `editUrl` (a troupe URL),
  `editUrl: false`, `lastUpdated: 2026-01-02` and `pagefind: false`, in turn. Verify, by `npm run build` and the built
  HTML: the edit link's href changes and then disappears, "Last updated" shows 2 January 2026, and the page is missing
  from `dist/pagefind/` when `pagefind: false` is set. Record the result in this task.
  Result, 2026-10-19 (Starlight 0.42.5, Astro 7.3.6): `editUrl: <troupe URL>` made the page's "Improve this page"
  href that URL; `editUrl: false` left no edit link (0 matches); `lastUpdated: 2026-01-02` rendered
  `<time datetime="2026-01-02T00:00:00.000Z">Jan 2, 2026</time>`; `pagefind: false` dropped `data-pagefind-body` from
  the page, so Pagefind skips it, while a normal page keeps it.
- [x] 1.2 In the same scratch tree, replace `route.sidebar` and `route.pagination` from route middleware for one route.
  Verify: the built page shows the replaced sidebar and "Next" link, and `astro check` passes. Record the result in this
  task. If 1.1 or 1.2 fails, stop and tell the owner: it's the design spec's 6.4 revisit trigger.
  Result, 2026-10-19: middleware that replaced `route.sidebar` and `route.pagination` for
  `docs/backstage/licensing` rendered the replaced group, link and "Next" link in the built page; `astro check`
  reported 0 errors.
- [x] 1.3 Check whether `redirects` in a static Astro build can point at an external URL (`https://github.com/...`).
  Verify: the built `dist/` holds a redirect page for it. Record which form D10 will use. Then
  `git restore` the scratch edits, and verify that `git status` is clean.
  Result, 2026-10-19: `redirects: { '/spike-ext': 'https://github.com/…/CONTRIBUTING.md' }` built
  `dist/spike-ext/index.html` with a meta refresh, a canonical link and a fallback link to the URL. D10 uses `redirects`
  directly; no hand-made page is needed. Scratch edits restored with `git restore`; `git status` was clean.

## 2. The sync library: versions, contract and layout (D2, D3, D4)

- [x] 2.1 Write `tests/unit/troupe-versions.test.ts` for `chooseVersions` first:
  - no tags;
  - one tag;
  - patches of the latest minor and of an earlier one;
  - an earlier major;
  - another component's tag ignored;
  - `troupe-v1.0.0-rc.1` and `troupe-v1.2` refused, naming the tag.
  Then implement it in `scripts/troupe-docs-lib.mjs`. Verify: the tests failed before the implementation and pass after
  it.
- [x] 2.2 Port troupe's front-matter reader (`userdocs.py`'s `parse` and `problems`) to the library. Copy its cases
  from troupe's `packages/troupe/tests/` as JS unit tests: quoting, reserved words, numbers, a duplicate key, an unknown
  key, a written page without `prerelease`, and a planned page with a body. Verify: each case gives the same result as
  in troupe, and each error names the page, the key and the fix.
  Done 2026-10-19: 22 cases in `tests/unit/troupe-front-matter.test.ts`, each troupe's input and message, pass.
- [x] 2.3 Add the contract drift test. It reads `FRONT_MATTER_KEYS` from troupe's `main` (the synced clone) and
  compares it with the library's key set, and asserts that the site-only keys the sync writes are exactly `slug`,
  `editUrl`, `lastUpdated` and `pagefind` (`slug` added 2026-10-20, design D4). Verify: the test passes, and fails naming the key when a key is added on one side only
  (tried by hand, then restored).
  Done 2026-10-19: `tests/unit/troupe-contract.test.ts` reads troupe main's `userdocs.py`. Its key test failed naming `order` when that key was added to the site's set only, and the schema test failed naming it when it was added to `content.config.ts` only (both restored). It also runs troupe's own reader against the port on troupe's 29 pages and 433 generated ones. The first run found 90 messages that quoted values differently (JSON, not Python's `repr`), now fixed.
- [x] 2.4 Add the layout check: only `.md` pages directly inside the six sections. Verify: unit tests for `.mdx`, a
  nested page, a seventh section and a stray file each fail naming the version and the path.
  Done 2026-10-19: 9 tests in `tests/unit/troupe-layout.test.ts` pass.
- [x] 2.5 Add the source: a bare clone in `.cache/troupe.git`, fetched on each run (a partial clone was measured at 22 s
  to read `main`'s pages, against 2.5 s for a full clone, design D2), or `TROUPE_DOCS`, with
  `main` from its working tree. Verify, with unit tests against a temporary repository:
  - an unset `TROUPE_DOCS` uses the clone;
  - an empty value, or a folder with no `docs/`, is refused, naming the variable and value;
  - a failed fetch is refused, naming the remote and saying to set `TROUPE_DOCS`, and the stale cache isn't used.
  Done 2026-10-19: 11 tests in `tests/unit/troupe-source.test.ts` pass, against throwaway repositories.
- [x] 2.6 Write each version's pages into `src/content/docs/docs/` (root, `next/`, `vX.Y/`) with:
  - the generated-file comment;
  - JSON-quoted front matter;
  - `editUrl` per D7;
  - `lastUpdated` per D4;
  - `pagefind` per D8.
  Also write a manifest of versions and their pages to `src/generated/troupe-docs.json`. Add both, and `.cache/`, to
  `.gitignore`. Verify: unit tests on a temporary repository check every field for a current, a next and an archived
  page, and for a page that's gone from `main`.
  Done 2026-10-19: 12 tests in `tests/unit/troupe-sync.test.ts` pass. Pages are read back with the `yaml` package, as Astro would read them.
- Commits: groups 2 and 3 land together, once the site builds from troupe and `scripts/check.py` passes (3.5).

## 3. Build /docs from troupe (D1, D2, D5)

- [x] 3.1 Add the integration to `astro.config.mjs`: run the sync in `astro:config:setup`, and add the version
  redirects. Add `npm run docs:sync`. Verify: `npm run docs:sync` writes the 29 pages and the manifest, and `astro dev`,
  `astro check` and `astro build` each run it.
  Done 2026-10-19: `npm run docs:sync` wrote 29 pages and the manifest. `astro dev`, `astro check` and `astro build` each logged `[troupe-docs] /docs/ from main, 29 pages`, and `/docs/` redirects to `/docs/programme/what-is-troupe/`. The website's own pages had to be removed first (3.3's `git rm`), because the sync refuses to clear a folder it didn't write.
- [x] 3.2 Write the remark link plugin, with unit tests first:
  - a sibling link, a parent-section link and an anchor;
  - a link in an archived version;
  - a link in inline code and in a code block, left unchanged;
  - an absolute URL, left unchanged;
  - a link escaping `docs/`, refused with page and link.
  Verify: the tests failed first, then pass.
  Done 2026-10-19: 17 tests in `tests/unit/troupe-links.test.ts` pass, the pipeline ones through Astro's Sätteri processor. With the plugin off, the three that depend on it failed. Astro 7's default processor is Sätteri, not remark, so this is a Sätteri mdast plugin added to the processor's own list, as Starlight adds its plugins. `@astrojs/markdown-satteri` is now a direct dependency, at the 0.4.3 Astro already pins, because the config imports it.
- [x] 3.3 Remove the website's 29 copied pages and `backstage/contributing.md` with `git rm`. Replace the sidebar config
  with `src/lib/docs-nav.ts`, holding today's labels and order (wired in 4.1). Verify: `npm run build` passes against
  troupe's `main`, `dist/docs/` has the 29 pages, and `npm run linkcheck` passes. Following one anchor link per section
  in the built HTML lands on an existing `id`.
  Done 2026-10-19: `npm run build` passes against troupe's main, `dist/docs/` has 29 pages, and `npm run linkcheck` passes. troupe's pages have 6 cross-page anchor links, in three sections (opening-night, prompt-book, the-company), and every one lands on an existing `id`. The other three sections have none, so "one per section" isn't possible yet. 3.4 makes this a permanent test over every anchor link. The website's copies went with `git rm`, and Status and roadmap with `git mv` to `src/content/docs/status.md` (5.1).
- [x] 3.4 Rewrite `tests/e2e/docs.spec.ts` for the real build:
  - every page in the manifest exists and appears in the sidebar;
  - each has "Improve this page" linking to `troupe-run/troupe/edit/main/docs/<path>`;
  - "Last updated" shows;
  - the notes follow front matter;
  - `/docs/` redirects;
  - the glossary has no horizontal scroll at 320px.
  Check `tests/e2e/a11y.spec.ts`'s page list still names pages that exist. Verify: `npm run test:e2e` passes.
  Done 2026-10-20: `npx playwright test` passed, 182 tests. `a11y.spec.ts` swaps the old stub page, which no longer exists in troupe's docs, for the glossary and the CLI reference. The CLI reference showed two real issues the website's pages never had. (1) Code inside a link failed contrast (4.04:1 light, 4.49:1 dark), so `starlight.css` drops the code background inside links, which the owner sees in 4.4. (2) Expressive Code makes a scrolling block focusable from a script about 250 ms after load, so the axe test now waits for it, and fails if it never comes.
- [x] 3.5 Run `uv run scripts/check.py`. Verify: every gate passes. Commit groups 2 and 3.
  Done 2026-10-20: `uv run scripts/check.py`, all gates passed. Committed with 4.1, 7.1 and 7.2, which this commit needs: the vocabulary tests read the glossary from troupe. `scripts/tests/test_check.py` now ignores URLs when it looks for skipped files, since the org's CONTRIBUTING.md URL isn't this repository's file.

## 4. Sidebars, the version menu, banners, edit links and search (D6, D7, D8)

- [x] 4.1 Build each route's sidebar and pagination from its version in route middleware:
  - listed pages in order, then unlisted ones by title;
  - Programme ends with "Status and roadmap", and Backstage ends with "Contributing".
  Verify, with unit tests of the sidebar builder: an unlisted page is appended, a listed page a version lacks is
  dropped, and every link stays in the version.
  Done 2026-10-20, ahead of 3.4 since 3.4's tests read the sidebar: 12 tests in `tests/unit/docs-versions.test.ts` pass. On the real build, `/docs/the-company/flows/` shows the six sections in order and 29 links in its version, marks itself current, ends Programme and Backstage with the two kept links, and links Previous and Next to its neighbours.
- [x] 4.2 Add `src/content/copy/versions.md` (a `versions` copy section) with the menu label and the archived and
  next banners. Verify: `astro check` passes on the schema. Show the text to the owner, and record their approval or
  edits here before ticking.
  Owner, 2026-10-20: wording approved as written ("Wording is fine").
- [x] 4.3 Render the version menu and banners in the `MarkdownContent` override (no new override). The menu is a
  `<details>` of links, each to the same page in that version or its first page, with `aria-current` on the version
  being read. At the end of a page with no edit link, render "View source" to the page at its version's tag (D7).
  Verify: unit tests of the "same page or first page" function and of the source URL, and on the real build, the menu
  shows one "unreleased" entry, no banner and no "View source".
  Done 2026-10-20: `VersionMenu.astro`, rendered by the existing `MarkdownContent` override, so the override count stays at six. 9 new unit tests (label, versionNotice, sourceUrl) pass. On the real build, the menu has one "unreleased" entry, with no banner and no View source. On the fixture, the menu, banners and View source match D6 and D7.
- [x] 4.4 Build and screenshot one archived page, one next page and one current page, at 320px and desktop, in light and
  dark, from the fixture build (6.2). Show the owner. Verify: no horizontal scroll at 320px, and the owner's approval is
  recorded here before ticking.
  Owner, 2026-10-20, after the first screenshots: the menu goes at the top of the whole docs site, showing only the current version until opened, not in the content (design D6). After the second set, at 320px and desktop, light and dark, closed and open: "Header looks good". The screenshots also caught the open list overflowing at 320px, now tested, and unstyled links in the notes.

- [x] 4.5 Stop rendering the pre-alpha note in `MarkdownContent` (D15). Keep the planned note and the `prerelease` key.
  Verify: the e2e test that a `prerelease: true` page shows no pre-alpha note passes, and failed before the change.
  The contract tests still pass.
  Done 2026-10-20: the e2e test failed while the note was rendered and passes now. It looks for the note's exact sentence, because troupe's own text says "pre-alpha". `prerelease` stays in `content.config.ts`, and the contract tests are unchanged.

## 5. The pages the website keeps (D10)

- [x] 5.1 Add `src/content/docs/status.md` with today's Status and roadmap text, unchanged. Make `siteSection()` answer
  `site` for it, and the middleware drop its sidebar. Verify: unit tests for `siteSection`, and an e2e test that
  `/status/` has the site header, no sidebar, no version menu, and an "Improve this page" link to this repository.
  Done 2026-10-20: `status.md` is the old page, moved with `git mv` and its text unchanged. `siteSection` answers `site` for it (6 unit tests). Starlight's 404 stays `docs`, as before. `tests/e2e/status.spec.ts`: `/status/` has the plain wordmark, no sidebar, the tab title "Status and roadmap | troupe", and an edit link to this repository. Added to the axe pages.
- [x] 5.2 Add the redirects, in the form 1.3 found: `/docs/programme/status-and-roadmap/` to `/status/`, and
  `/docs/backstage/contributing/` to the org's CONTRIBUTING.md. Verify: an e2e test for each lands at its target.
  `npm run linkcheck` passes.
  Done 2026-10-20: both redirects come from `redirects` (1.3), and both e2e tests pass. GitHub is stubbed in the external one, so the test reaches no external host. `npm run linkcheck` passes.

## 6. The fixture build (D9)

- [x] 6.1 Write `tests/fixtures/troupe-docs/` (a short history of a few pages in three sections, with one page added,
  one removed and one renamed between versions) and `scripts/troupe-fixture.mjs`. The script makes a temporary
  repository from it, with tags `troupe-v0.1.0`, `troupe-v0.1.1` and `troupe-v0.2.0` and commits after them. Verify, with
  a unit test: the repository has those tags, has no remote, and is deleted afterwards, also when the build fails.
  Done 2026-10-20: `tests/fixtures/troupe-docs/` holds four steps (troupe-v0.1.0, v0.1.1, v0.2.0, main), with a page removed (old-guide), one renamed (build-a-flow to design-a-flow), a planned page added (roles-and-actors), and a main-only page the sidebar order doesn't name (new-guide). 3 tests in `tests/unit/troupe-fixture.test.ts` pass: the tags, commits after the last one, no remote, and the repository deleted after a passing and a failing build.
- [x] 6.2 Add `npm run build:fixture` (into `dist-fixture/`, git-ignored). Add it to `scripts/check.py` after the build,
  run the link check on both outputs, and update `scripts/tests/` for the new gate order. Verify: `uv run
  scripts/check.py`'s own tests pass, and the gate list matches the `quality-check` spec's order.
  Done 2026-10-20: `npm run build:fixture` built `/docs/next/` from main (6 pages), `/docs/` from troupe-v0.2.0 (5) and `/docs/v0.1/` from troupe-v0.1.1 (5). `check.py` gained "fixture build" and "fixture link check", in the quality-check spec's order, and its own tests pass. The first fixture build showed Astro's slugs drop the dot in `v0.1` (`/docs/v01/`), so each page now carries a `slug` (design D4). `astro preview` no longer syncs, so a preview can't rewrite pages under another build.
- [x] 6.3 Add the Playwright project `versions`, with its own preview server on `dist-fixture/` and its own free port,
  and write `tests/e2e/versions.spec.ts`:
  - `/docs/` is v0.2, `/docs/v0.1/` comes from v0.1.1, and `/docs/next/` is `main`;
  - the menu lists and links;
  - keyboard use;
  - banners;
  - each version's sidebar;
  - root redirects;
  - edit links only on current and next, and "View source" to the tag on archived pages (followed: the URL is the
    fixture tag's page);
  - search results on current only;
  - axe in light and dark.
  Verify: each test fails when its feature is disabled by hand (record which), then passes.
  Done 2026-10-20: 32 tests in `tests/e2e/versions.spec.ts` pass on the `versions` project, which serves `dist-fixture/` on E2E_FIXTURE_PORT without building it. Five features were disabled together (indexing every version, archived pages editable, menu entries always the first page, sidebar links under /docs/, banners off), the fixture rebuilt, and 9 tests failed: both search tests, the archived edit/source test, two menu tests, the v0.1 sidebar test and the three banner tests. All restored and rebuilt: 32 passed. Search is checked through Pagefind's own API, because Starlight 0.42's search box is Pagefind's web component.
- [x] 6.4 Add a unit test that `deploy.yml` never runs `build:fixture` or sets `TROUPE_DOCS`. Verify: it passes, and
  fails when either is added (tried, then restored).
  Done 2026-10-20: the last test in `tests/unit/deploy-workflow.test.ts` passes. It failed when a `npm run build:fixture` step was added, and again when `TROUPE_DOCS` was set on a step, and both edits were restored.
- [x] 6.5 Run `uv run scripts/check.py`, and commit groups 4 to 6. Verify: every gate passes.
  Done 2026-10-20: all 11 gates passed, and e2e ran 188 chromium and 32 versions tests. `tsconfig.json` now excludes `dist-fixture`, as it excludes `dist`. 4.2 and 4.4 wait on the owner, and the copy can change after this commit.

## 7. Vocabulary and the brand guide (D13)

- [x] 7.1 Point `tests/unit/vocabulary.test.ts`'s `GLOSSARY` at the manifest's `main` glossary, failing with "run npm
  run docs:sync" when it's missing. Drop the house page and glossary "TBC" checks and the docs pages from the "project"
  scan, and scan `src/content/copy/` and `src/content/docs/status.md`. Verify: the test file's names say exactly what
  each test checks, and the tests fail before 7.2 only on §6's link and `system` row.
  Done 2026-10-20: GLOSSARY comes from the manifest, and the test fails saying to run `npm run docs:sync` when it's missing. The TBC check covers the brand guide, the landing copy and `status.md`, and the "project" scan covers the landing copy and `status.md`. The four docs-page records went to troupe. Added a test that §6 writes each term plainly, since the table reader strips backticks and nothing else would catch `system` in code font. Against the brand guide at HEAD, exactly two tests fail: the §6 link and the plain-term test.
- [x] 7.2 Update the brand guide's §6: link the glossary at
  `https://github.com/troupe-run/troupe/blob/main/docs/prompt-book/glossary.md`, and make the `system` row plain. Verify:
  `npm run test:unit` passes.
  Done 2026-10-20: §6 links the glossary in troupe, and its system row is plain. `npx vitest run tests/unit/vocabulary.test.ts`: 13 passed.
- [x] 7.3 Record the build times of `npm run build` and `npm run build:fixture`, from a fresh clone cache and a warm
  one, in this task. Verify: the numbers are recorded.
  Done 2026-10-20, on the owner's Mac: `npm run build` took 4.8 s with a fresh clone cache (clone included) and 4.0 s warm. `npm run build:fixture` took 3.7 s, and `npm run docs:sync` alone 2.0 s warm. No cache of rendered output is needed (D3).
- [x] 7.4 Run `uv run scripts/check.py` and commit. Verify: every gate passes.
  Done 2026-10-20: 7.1 to 7.3 landed in b5f2639. This commit carries 7.3's record, after all gates passed (223 e2e tests).

## 8. The deploy starts on troupe's notice (D11)

- [x] 8.1 Write unit tests for `deploy.yml` first:
  - `workflow_dispatch` has no inputs;
  - the build job runs only on a successful `workflow_run` push, or a dispatch on `refs/heads/main`;
  - the build job's concurrency cancels in progress and the deploy job's doesn't;
  - a link check step runs after the build and before the deploy job.
  Verify: they fail on today's file.
  Done 2026-10-20: 8 tests in `tests/unit/deploy-workflow.test.ts`. On today's `deploy.yml`, 5 failed (dispatch, build condition, checkout ref, concurrency, link check) and 3 passed (still runs after CI, github-pages only, no fixture), which are the parts that don't change.
- [x] 8.2 Change `deploy.yml` to match. Verify: the tests pass, `workflow-node-version.test.ts` still passes, and
  `actionlint` (or `gh workflow view` after push) reports no syntax error.
  Done 2026-10-20: `tests/unit/deploy-workflow.test.ts` (8) and `workflow-node-version.test.ts` pass. actionlint 1.7.12 (`uvx --from actionlint-py actionlint`) reports nothing for `deploy.yml`, and the pushed branch's `guard` run passed.
- [x] 8.3 Run `uv run scripts/check.py` and commit. Verify: every gate passes.
  Done 2026-10-20: committed after the guard's check passed. 8.2's syntax check runs once the branch is pushed.

## 9. The repository says where the docs live (D14)

- [x] 9.1 Update CLAUDE.md, README.md and CONTRIBUTING.md: `/docs` is edited in troupe-run/troupe's `docs/`, and
  `TROUPE_DOCS` previews local edits. Update `openspec/config.yaml`'s context lines on docs ownership, and on edit links: every docs page links to its own
  source, by "Improve this page" on `next` and the latest release, and by "View source" at the tag otherwise.
  Verify: `openspec validate docs-from-troupe --strict` passes, and `grep -rn 'src/content/docs/docs'` outside
  `openspec/changes/archive/` and `docs/superpowers/` finds only the generated-folder references.
  Done 2026-10-20: `openspec validate docs-from-troupe --strict` passes. Outside the archive and the dated design, `grep` finds `src/content/docs/docs` only where the generated folder is meant: the docs that say not to edit it, `.gitignore`, the link plugin and the tests.
- [x] 9.2 Commit. Verify: the guard's commit hook passes.
  Done 2026-10-20: committed with the header picker (owner, 4.4). The guard's hook ran the check.

- [x] 9.3 Update `openspec/config.yaml`'s context line on the pre-alpha note (D15). Verify: `grep -n "pre-alpha note"
  openspec/config.yaml` finds only the line saying there's none, and `openspec validate docs-from-troupe --strict`
  passes.
  Done 2026-10-20: `grep -n "pre-alpha note" openspec/config.yaml` finds only the line saying there's none, and `openspec validate docs-from-troupe --strict` passes.

## 10. troupe's notice job (D12), in troupe-run/troupe

- [x] 10.1 In a troupe worktree, on a branch named after a new troupe OpenSpec change `website-docs-notice` that cites
  troupe-run/website#23, propose and apply the `notify-website` job in `.github/workflows/release.yml`:
  - `needs: release-please`, `if: ${{ !cancelled() }}`;
  - `environment: docs`, `permissions: {}`, no checkout;
  - the pinned token action with `repositories: website` and `permission-actions: write`;
  - `gh workflow run deploy.yml -R troupe-run/website --ref main`.
  - The same change updates troupe's `user-docs` spec scenario "A page about the house", which relied on the site's
    pre-alpha note (D15).
  If troupe's guard asks for an issue in troupe, open one on the roadmap board. Verify: troupe's `scripts/check.py`
  passes, and the commits are signed off.
  Done 2026-10-20: troupe's change `website-docs-notice` (55f6d82 proposal, 1c065c2 job and house scenario), both commits signed off. actionlint is clean and troupe's `scripts/check.py` passed (2011 tests). It cites troupe-run/website#23, and troupe's guard asked for no troupe issue.
- [ ] 10.2 Open troupe's PR, saying it merges after this repository's PR is deployed. Verify: its CI passes. Don't merge
  it yet.

## 11. Integration

- [x] 11.1 Run `uv run scripts/check.py` on the final tree. Verify: every gate passes. Save the output to the scratchpad.
  Done 2026-10-20: all 11 gates passed, with 223 e2e tests across both projects. The output is saved at /private/tmp/claude-502/-Users-martin-Projects-troupe-website-docs-from-troupe/00fbfdeb-a938-4d36-bc32-5598435aa48a/scratchpad/final-check-saved.log.
- [ ] 11.2 Open this repository's PR with `Closes #23`, linking troupe's PR and the merge order. Verify: CI's `test` and
  `guard` pass.

## Workflow follow-up

- Run `/opsx:archive` on the branch before merging, then merge by rebase.
- After the deploy, the owner dispatches the deploy once by hand (`gh workflow run deploy.yml -R troupe-run/website
  --ref main`). Check that it builds, checks links and publishes.
- Merge troupe's PR. Check that its first run on `main` starts a website deploy as `workflow_dispatch`, and that the
  deploy publishes.
- Comment on #23 with both PRs and the archived change, and close it. Check that its card says Done. Note on
  troupe-run/troupe#123 that `/docs` is no longer frozen.
