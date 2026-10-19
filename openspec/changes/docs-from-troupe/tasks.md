# Tasks

## 1. Prove Starlight's per-page fields and route data (design Context, Risks)

- [ ] 1.1 On a scratch branch that isn't committed, give one existing page front matter with `editUrl` (a troupe URL),
  `editUrl: false`, `lastUpdated: 2026-01-02` and `pagefind: false`, in turn. Verify, by `npm run build` and the built
  HTML: the edit link's href changes and then disappears, "Last updated" shows 2 January 2026, and the page is missing
  from `dist/pagefind/` when `pagefind: false` is set. Record the result in this task.
- [ ] 1.2 In the same scratch tree, replace `route.sidebar` and `route.pagination` from route middleware for one route.
  Verify: the built page shows the replaced sidebar and "Next" link, and `astro check` passes. Record the result in this
  task. If 1.1 or 1.2 fails, stop and tell the owner: it's the design spec's 6.4 revisit trigger.
- [ ] 1.3 Check whether `redirects` in a static Astro build can point at an external URL (`https://github.com/...`).
  Verify: the built `dist/` holds a redirect page for it. Record which form D10 will use. Then
  `git restore` the scratch edits, and verify that `git status` is clean.

## 2. The sync library: versions, contract and layout (D2, D3, D4)

- [ ] 2.1 Write `tests/unit/troupe-versions.test.ts` for `chooseVersions` first:
  - no tags;
  - one tag;
  - patches of the latest minor and of an earlier one;
  - an earlier major;
  - another component's tag ignored;
  - `troupe-v1.0.0-rc.1` and `troupe-v1.2` refused, naming the tag.
  Then implement it in `scripts/troupe-docs-lib.mjs`. Verify: the tests failed before the implementation and pass after
  it.
- [ ] 2.2 Port troupe's front-matter reader (`userdocs.py`'s `parse` and `problems`) to the library. Copy its cases
  from troupe's `packages/troupe/tests/` as JS unit tests: quoting, reserved words, numbers, a duplicate key, an unknown
  key, a written page without `prerelease`, and a planned page with a body. Verify: each case gives the same result as
  in troupe, and each error names the page, the key and the fix.
- [ ] 2.3 Add the contract drift test. It reads `FRONT_MATTER_KEYS` from troupe's `main` (the synced clone) and
  compares it with the library's key set, and asserts that the site-only keys the sync writes are exactly `editUrl`,
  `lastUpdated` and `pagefind`. Verify: the test passes, and fails naming the key when a key is added on one side only
  (tried by hand, then restored).
- [ ] 2.4 Add the layout check: only `.md` pages directly inside the six sections. Verify: unit tests for `.mdx`, a
  nested page, a seventh section and a stray file each fail naming the version and the path.
- [ ] 2.5 Add the source: a bare partial clone in `.cache/troupe.git`, fetched on each run, or `TROUPE_DOCS`, with
  `main` from its working tree. Verify, with unit tests against a temporary repository:
  - an unset `TROUPE_DOCS` uses the clone;
  - an empty value, or a folder with no `docs/`, is refused, naming the variable and value;
  - a failed fetch is refused, naming the remote and saying to set `TROUPE_DOCS`, and the stale cache isn't used.
- [ ] 2.6 Write each version's pages into `src/content/docs/docs/` (root, `next/`, `vX.Y/`) with:
  - the generated-file comment;
  - JSON-quoted front matter;
  - `editUrl` per D7;
  - `lastUpdated` per D4;
  - `pagefind` per D8.
  Also write a manifest of versions and their pages to `src/generated/troupe-docs.json`. Add both, and `.cache/`, to
  `.gitignore`. Verify: unit tests on a temporary repository check every field for a current, a next and an archived
  page, and for a page that's gone from `main`.
- Commits: groups 2 and 3 land together, once the site builds from troupe and `scripts/check.py` passes (3.5).

## 3. Build /docs from troupe (D1, D2, D5)

- [ ] 3.1 Add the integration to `astro.config.mjs`: run the sync in `astro:config:setup`, and add the version
  redirects. Add `npm run docs:sync`. Verify: `npm run docs:sync` writes the 29 pages and the manifest, and `astro dev`,
  `astro check` and `astro build` each run it.
- [ ] 3.2 Write the remark link plugin, with unit tests first:
  - a sibling link, a parent-section link and an anchor;
  - a link in an archived version;
  - a link in inline code and in a code block, left unchanged;
  - an absolute URL, left unchanged;
  - a link escaping `docs/`, refused with page and link.
  Verify: the tests failed first, then pass.
- [ ] 3.3 Remove the website's 29 copied pages and `backstage/contributing.md` with `git rm`. Replace the sidebar config
  with `src/lib/docs-nav.ts`, holding today's labels and order (wired in 4.1). Verify: `npm run build` passes against
  troupe's `main`, `dist/docs/` has the 29 pages, and `npm run linkcheck` passes. Following one anchor link per section
  in the built HTML lands on an existing `id`.
- [ ] 3.4 Rewrite `tests/e2e/docs.spec.ts` for the real build:
  - every page in the manifest exists and appears in the sidebar;
  - each has "Improve this page" linking to `troupe-run/troupe/edit/main/docs/<path>`;
  - "Last updated" shows;
  - the notes follow front matter;
  - `/docs/` redirects;
  - the glossary has no horizontal scroll at 320px.
  Check `tests/e2e/a11y.spec.ts`'s page list still names pages that exist. Verify: `npm run test:e2e` passes.
- [ ] 3.5 Run `uv run scripts/check.py`. Verify: every gate passes. Commit groups 2 and 3.

## 4. Sidebars, the version menu, banners, edit links and search (D6, D7, D8)

- [ ] 4.1 Build each route's sidebar and pagination from its version in route middleware:
  - listed pages in order, then unlisted ones by title;
  - Programme ends with "Status and roadmap", and Backstage ends with "Contributing".
  Verify, with unit tests of the sidebar builder: an unlisted page is appended, a listed page a version lacks is
  dropped, and every link stays in the version.
- [ ] 4.2 Add `src/content/copy/docs-versions.md` (a `versions` copy section) with the menu label and the archived and
  next banners. Verify: `astro check` passes on the schema. Show the text to the owner, and record their approval or
  edits here before ticking.
- [ ] 4.3 Render the version menu and banners in the `MarkdownContent` override (no new override). The menu is a
  `<details>` of links, each to the same page in that version or its first page, with `aria-current` on the version
  being read. At the end of a page with no edit link, render "View source" to the page at its version's tag (D7).
  Verify: unit tests of the "same page or first page" function and of the source URL, and on the real build, the menu
  shows one "unreleased" entry, no banner and no "View source".
- [ ] 4.4 Build and screenshot one archived page, one next page and one current page, at 320px and desktop, in light and
  dark, from the fixture build (6.2). Show the owner. Verify: no horizontal scroll at 320px, and the owner's approval is
  recorded here before ticking.

## 5. The pages the website keeps (D10)

- [ ] 5.1 Add `src/content/docs/status.md` with today's Status and roadmap text, unchanged. Make `siteSection()` answer
  `site` for it, and the middleware drop its sidebar. Verify: unit tests for `siteSection`, and an e2e test that
  `/status/` has the site header, no sidebar, no version menu, and an "Improve this page" link to this repository.
- [ ] 5.2 Add the redirects, in the form 1.3 found: `/docs/programme/status-and-roadmap/` to `/status/`, and
  `/docs/backstage/contributing/` to the org's CONTRIBUTING.md. Verify: an e2e test for each lands at its target.
  `npm run linkcheck` passes.

## 6. The fixture build (D9)

- [ ] 6.1 Write `tests/fixtures/troupe-docs/` (a short history of a few pages in three sections, with one page added,
  one removed and one renamed between versions) and `scripts/troupe-fixture.mjs`. The script makes a temporary
  repository from it, with tags `troupe-v0.1.0`, `troupe-v0.1.1` and `troupe-v0.2.0` and commits after them. Verify, with
  a unit test: the repository has those tags, has no remote, and is deleted afterwards, also when the build fails.
- [ ] 6.2 Add `npm run build:fixture` (into `dist-fixture/`, git-ignored). Add it to `scripts/check.py` after the build,
  run the link check on both outputs, and update `scripts/tests/` for the new gate order. Verify: `uv run
  scripts/check.py`'s own tests pass, and the gate list matches the `quality-check` spec's order.
- [ ] 6.3 Add the Playwright project `versions`, with its own preview server on `dist-fixture/` and its own free port,
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
- [ ] 6.4 Add a unit test that `deploy.yml` never runs `build:fixture` or sets `TROUPE_DOCS`. Verify: it passes, and
  fails when either is added (tried, then restored).
- [ ] 6.5 Run `uv run scripts/check.py`, and commit groups 4 to 6. Verify: every gate passes.

## 7. Vocabulary and the brand guide (D13)

- [ ] 7.1 Point `tests/unit/vocabulary.test.ts`'s `GLOSSARY` at the manifest's `main` glossary, failing with "run npm
  run docs:sync" when it's missing. Drop the house page and glossary "TBC" checks and the docs pages from the "project"
  scan, and scan `src/content/copy/` and `src/content/docs/status.md`. Verify: the test file's names say exactly what
  each test checks, and the tests fail before 7.2 only on §6's link and `system` row.
- [ ] 7.2 Update the brand guide's §6: link the glossary at
  `https://github.com/troupe-run/troupe/blob/main/docs/prompt-book/glossary.md`, and make the `system` row plain. Verify:
  `npm run test:unit` passes.
- [ ] 7.3 Record the build times of `npm run build` and `npm run build:fixture`, from a fresh clone cache and a warm
  one, in this task. Verify: the numbers are recorded.
- [ ] 7.4 Run `uv run scripts/check.py` and commit. Verify: every gate passes.

## 8. The deploy starts on troupe's notice (D11)

- [ ] 8.1 Write unit tests for `deploy.yml` first:
  - `workflow_dispatch` has no inputs;
  - the build job runs only on a successful `workflow_run` push, or a dispatch on `refs/heads/main`;
  - the build job's concurrency cancels in progress and the deploy job's doesn't;
  - a link check step runs after the build and before the deploy job.
  Verify: they fail on today's file.
- [ ] 8.2 Change `deploy.yml` to match. Verify: the tests pass, `workflow-node-version.test.ts` still passes, and
  `actionlint` (or `gh workflow view` after push) reports no syntax error.
- [ ] 8.3 Run `uv run scripts/check.py` and commit. Verify: every gate passes.

## 9. The repository says where the docs live (D14)

- [ ] 9.1 Update CLAUDE.md, README.md and CONTRIBUTING.md: `/docs` is edited in troupe-run/troupe's `docs/`, and
  `TROUPE_DOCS` previews local edits. Update `openspec/config.yaml`'s context lines on docs ownership, and on edit links: every docs page links to its own
  source, by "Improve this page" on `next` and the latest release, and by "View source" at the tag otherwise.
  Verify: `openspec validate docs-from-troupe --strict` passes, and `grep -rn 'src/content/docs/docs'` outside
  `openspec/changes/archive/` and `docs/superpowers/` finds only the generated-folder references.
- [ ] 9.2 Commit. Verify: the guard's commit hook passes.

## 10. troupe's notice job (D12), in troupe-run/troupe

- [ ] 10.1 In a troupe worktree, on a branch named after a new troupe OpenSpec change `website-docs-notice` that cites
  troupe-run/website#23, propose and apply the `notify-website` job in `.github/workflows/release.yml`:
  - `needs: release-please`, `if: ${{ !cancelled() }}`;
  - `environment: docs`, `permissions: {}`, no checkout;
  - the pinned token action with `repositories: website` and `permission-actions: write`;
  - `gh workflow run deploy.yml -R troupe-run/website --ref main`.
  If troupe's guard asks for an issue in troupe, open one on the roadmap board. Verify: troupe's `scripts/check.py`
  passes, and the commits are signed off.
- [ ] 10.2 Open troupe's PR, saying it merges after this repository's PR is deployed. Verify: its CI passes. Don't merge
  it yet.

## 11. Integration

- [ ] 11.1 Run `uv run scripts/check.py` on the final tree. Verify: every gate passes. Save the output to the scratchpad.
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
