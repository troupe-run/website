# Design

## Context

- **troupe's side is in place** (troupe-run/troupe#128, merged 2026-10-19):
  - troupe's `docs/` holds 29 pages in the six sections, each at its site path. For example,
    `docs/the-company/theatres.md` publishes at `/docs/the-company/theatres/` (troupe's `user-docs` spec).
  - Front matter is a closed, strict subset of YAML. `packages/troupe/tests/userdocs.py` allows exactly `title`,
    `description`, `status`, `prerelease` and `purpose`. Its `FRONT_MATTER_KEYS` constant says this site's schema must
    allow exactly those keys.
  - Pages link each other by relative `.md` paths with anchors (`../the-company/flows.md`, `cli.md#errors`), checked by
    troupe's docs tests. A link out of `docs/` is an absolute GitHub URL.
  - One page links `https://troupe.run/docs/programme/status-and-roadmap/`.
  - There's no render check in troupe yet.
- **troupe has no tags and no releases.** release-please tags each component (`include-component-in-tag`), with linked
  versions, so `troupe-vX.Y.Z` stands for the whole release. Tags are created inside the release workflow's run on
  `main` (troupe-run/infrastructure design D3).
- **The credential** (troupe-run/infrastructure#110, design D4) is the `troupe-run-docs` App:
  - it holds "Actions: write" on troupe-run/website only, so it can start `workflow_dispatch` and can't send
    `repository_dispatch`;
  - troupe's `docs` environment is limited to `main`, and holds `DOCS_APP_CLIENT_ID` and `DOCS_APP_PRIVATE_KEY`, both
    set;
  - the website's build must treat any inputs as data, and deploy only through `github-pages`, which is limited to
    `main`.
- **The website today:**
  - Starlight's `docs` collection uses `docsLoader()` over `src/content/docs/`, holding both `docs/…` (31 pages) and
    `blog/…`.
  - `astro.config.mjs` hand-orders the sidebar by slug, and sets `editLink.baseUrl` to this repository.
  - Starlight reads "Last updated" from this repository's git history.
  - Six components are overridden (Header, MobileMenuFooter, Head, MarkdownContent, ThemeProvider, ThemeSelect).
    `MarkdownContent` renders the planned and pre-alpha notes from front matter.
  - Route middleware strips the sidebar from blog pages.
- **The deploy** (`deploy.yml`) runs on `workflow_run` after CI succeeds on a push to `main`. It builds with
  `withastro/action`, with the Node version from `scripts/node-version.mjs`, and deploys through `github-pages`.
- **Starlight 0.42 accepts, per page:** `editUrl` (a URL, or `false`), `lastUpdated` (a date) and `pagefind` (a
  boolean), and route middleware can replace a route's `sidebar` and `pagination`. This design relies on those. Task 1
  proves them before anything depends on them.

## Goals / Non-Goals

**Goals:**
- One build path for every version, so `/docs/`, `/docs/next/` and `/docs/vX.Y/` render through the same Starlight
  pages, overrides and checks the site has today.
- Every input from troupe (tags, front matter, files, links) is checked. Anything unexpected stops the build with the
  version, the page and the fix, and nothing is guessed.
- Version behaviour is tested on every check, before troupe's first release and after it.
- No new component override, and no new npm dependency.

**Non-Goals:**
- troupe's render check, which builds this site against a troupe PR's docs. `TROUPE_DOCS` (D2) is the hook it will use,
  but the check itself is troupe's to add.
- Changing the content of troupe's pages, or troupe's page contract.
- Caching rendered versions between builds (D3 says why).
- Translations, or a version that isn't a troupe release or `main`.

## Decisions

### D1. The pages are synced into a generated content folder, which Starlight reads unchanged

Before Astro reads content, a sync step writes every version's pages into `src/content/docs/docs/`:
- the version at `/docs/` goes at the folder's root;
- the others go under `next/` and `vX.Y/`.

That folder is git-ignored and rewritten on every run. Starlight's `docsLoader()`, the existing schema, overrides and
link checks then treat the pages like any other content, and a page's id (`docs/v0.1/the-company/theatres`) is its URL.
Each generated page starts with an HTML comment naming its troupe ref and path, saying to edit it there.

- *Alternative: a custom content loader that reads troupe's files directly.* Starlight's `docs` collection holds the
  blog too. Combining that with per-version glob loaders means writing a loader against the content layer's store, and
  Astro's glob loader deletes entries it didn't load itself. It's more code against less stable APIs, with nothing
  gained over files on disk.
- *Alternative: the `starlight-versions` plugin.* It archives the site's own current docs into committed copies when a
  version is declared. Here, versions come from troupe's tags and the source isn't in this repository. It also calls
  itself early in development, and would add a dependency that wraps Starlight's routing.

### D2. The sync runs as a small Astro integration, from a cached clone or a local checkout

An integration in `astro.config.mjs` runs the sync in `astro:config:setup`. That covers `astro dev`, `astro check`,
`astro build` and `astro sync`, so no command can render stale or missing docs. The same hook adds the version
redirects (D6). The logic is in `scripts/troupe-docs-lib.mjs`, so unit tests can call it without Astro, and
`npm run docs:sync` runs it by hand.

Where the pages come from:
- **By default, from troupe-run/troupe on GitHub.** A bare clone is kept in the git-ignored `.cache/troupe.git` and
  fetched on every run, tags included. Each version's files are read from its ref with `git`, with no checkout.
  - A partial clone (`--filter=blob:none`) was measured and dropped (2026-10-19): it fetched each blob on its first
    read, so reading `main`'s 29 pages took 22 s.
  - A full bare clone of troupe took 2.5 s and 4 MB, and every read after it is local.
- **`TROUPE_DOCS=<path>`, from a local troupe checkout.**
  - `main`'s pages come from that checkout's working tree, so a writer can preview unpushed edits.
  - The tags come from that checkout's refs.
  - Fixture builds (D9) and troupe's future render check use this too.
- **Errors:**
  - A failed fetch stops the build, naming the remote and the git error. Its fix says to retry, or to set
    `TROUPE_DOCS` to work offline. It never falls back to the cache's last state, which would publish stale docs as
    current.
  - A `TROUPE_DOCS` that's set and empty, or isn't a git working tree with a `docs/` folder, is an error naming the
    variable and its value.

### D3. Versions are chosen from `troupe-v*` tags, by one pure function

`chooseVersions(tags, mainExists)` returns the versions in menu order. Each version has an id, a label, a URL
prefix, a ref and a role (`current`, `next` or `archived`).

- **Tags:**
  - A tag that matches `troupe-v*` must be `troupe-vMAJOR.MINOR.PATCH`, numbers only.
  - Any other `troupe-v*` tag, such as a pre-release suffix, is refused, naming the tag, since what a pre-release means
    for the docs isn't decided.
  - Tags not starting `troupe-v` (the other components' tags) are ignored.
- **With releases:**
  - The highest tag is `current`, at `/docs/`, labelled `vX.Y (latest)`.
  - `main` is `next`, at `/docs/next/`, labelled "next (unreleased)".
  - Every other minor is `archived`, at `/docs/vX.Y/`, from its highest patch tag, newest first. Older patches of the
    current minor aren't published. `v0.1.0` and `v0.1.1` publish one `v0.1`, from `v0.1.1`.
- **Before the first release:** `main` is `current`, at `/docs/`, labelled "unreleased". There's no `next`, so `/docs/`
  doesn't appear twice.
- **No caching of rendered output.** Astro builds the whole site at once, and each version is under 30 small pages, so
  a cache would save seconds and add a stale-output failure mode. Tags don't change, so rebuilding an archived version
  gives the same pages. Task 7.3 records the build time. A cache is reconsidered only if it grows.

### D4. Each page is checked against troupe's contract, then written with the site's own fields

For each version:
- **Every file under `docs/` must be a `.md` page in one of the six sections:** `programme`, `opening-night`,
  `the-company`, `stagecraft`, `prompt-book` or `backstage`, one level deep. Anything else is refused, naming the
  version and the path:
  - another file type, including `.mdx`, which would run code at build;
  - a page deeper than one level;
  - a seventh section.
- **Front matter is read by a JS port of troupe's strict subset reader** (`userdocs.py`'s `parse` and `problems`),
  with the same key set and rules:
  - an unknown key fails;
  - a written page without `prerelease` fails;
  - a planned page with a body fails.
  The port's unit tests copy troupe's cases, so the two readers can't quietly disagree (the differential rule). A unit
  test reads `FRONT_MATTER_KEYS` from troupe's `main` and compares it with the port's key set, so a key added in troupe
  fails here, naming it.
- **The page is written back with its five fields** as JSON-quoted YAML, plus the fields only the site sets:
  - `slug`: the page's URL path (`docs/v0.1/the-company/flows`). Astro slugs an id from the file's path, which drops
    the dot in `v0.1` (found by the first fixture build, 2026-10-20), so each page names its own;
  - `editUrl`, as D7 says;
  - `lastUpdated`: the date of the newest commit that touched the file at that ref. A page with uncommitted changes in
    a `TROUPE_DOCS` checkout gets none.
  - `pagefind: false` for `next` and `archived` pages, as D8 says;
  - nothing else.
- **The content schema keeps the site's three extra keys** (`status`, `prerelease`, `purpose`). A test asserts that the
  keys the sync passes through are exactly troupe's set, and the site-only keys are exactly those four. Adding a key in
  one place without the other then fails.

### D5. Links between pages are rewritten to the site's URLs, at build time

A remark plugin handles pages under the generated folder. It walks the Markdown tree, so code spans and blocks are
never touched, and rewrites each relative link that ends in `.md`, with or without an `#anchor`. The link is resolved
against the page's path within its version, and becomes that version's absolute URL: `../stagecraft/build-a-flow.md`,
on `/docs/v0.1/the-company/flows/`, becomes `/docs/v0.1/stagecraft/build-a-flow/`.

- A relative link that escapes `docs/`, or doesn't end in `.md`, stops the build, naming the page and the link. troupe's
  check already refuses both, so this only fires if the two drift.
- Absolute URLs aren't changed. troupe's link to `https://troupe.run/docs/programme/status-and-roadmap/` keeps working
  through the redirect (D10).
- A version's pages link within that version. The internal link check (`npm run linkcheck`) then checks every
  rewritten link in every version.
- Heading anchors match because GitHub and Astro both slug headings with `github-slugger`, and troupe's anchor check
  follows GitHub. Task 3.3 tests one anchor per section through the built site.
- *Alternative: rewrite the links with a regex in the sync.* That would rewrite links inside code examples, such as
  the CLI page's.

### D6. The sidebar and the version menu come from the versions' own pages

- **Sidebar:**
  - `src/lib/docs-nav.ts` keeps the six section labels and a page order, which are the website's (design), taken from
    today's `astro.config.mjs`.
  - Route middleware builds the sidebar from the current route's version. Listed pages present in that version come in
    the listed order. A page troupe adds that the list doesn't name follows them, in title order, so a new page appears
    without a website change. A listed page the version lacks is left out.
  - Programme ends with a link to `/status/`, and Backstage ends with a link to the org's CONTRIBUTING.md.
  - The middleware sets `pagination` from the same list, so "Next" and "Previous" stay in the version.
  - It uses Starlight's documented route-data API, and isn't an override.
- **Version menu:**
  - It's in the header, beside "troupe docs", on every docs page (owner, 2026-10-20: "at the top across the whole
    documentation site", not in the page's content). It's rendered by the existing `Header` override, so the override
    count stays at six.
  - Closed, it shows only the version being read ("v0.1"), so it stays small however many versions there are. Open,
    it's a list that scrolls past 60% of the window's height.
  - It's a `<details>` disclosure. Its entries are plain links, so changing version needs no script, and keyboard use
    is native. A small script closes it on Escape, returning focus, or on a click elsewhere. At phone width the list
    opens leftwards, so it stays in the window at 320px.
  - Each entry links to the same page in that version when the page exists there, and otherwise to that version's
    first sidebar page.
  - The current version's entry is marked with `aria-current="page"`.
- **Banners,** also in `MarkdownContent`, above the planned and pre-alpha notes:
  - **Archived:** "You're reading the docs for vX.Y. The latest release is vA.B." It links to the same page in the
    latest version, or to its start page.
  - **Next:** "Unreleased: these docs describe troupe's main, ahead of vA.B." It links in the same way.
  - **Unreleased current** (no release yet): no banner. The menu already says "unreleased", and the pre-alpha note
    already marks unbuilt behaviour.
- **The menu's and banners' words live in `src/content/copy/versions.md`** (a new `versions` copy section), so the
  owner reviews them as text, as the landing copy is reviewed.
- **Redirects:**
  - `/docs/next/` and each `/docs/vX.Y/` redirect to their version's first page, as `/docs/` does today.
  - The integration (D2) adds them to Astro's `redirects`, from the versions it chose.

### D7. "Improve this page" is on `/docs/next/` and the latest release only (owner, 2026-10-19)

- `editUrl` is `https://github.com/troupe-run/troupe/edit/main/docs/<path>` on pages of `next`, and of `current`, when
  the page exists on `main`.
- On `archived` pages, or when the page has gone from `main`, it's `false`, and Starlight shows no edit link. A planned
  page there shows its note without "Help write this page".
- Those pages link **"View source"** to the page at its version's ref instead:
  `https://github.com/troupe-run/troupe/blob/<tag>/docs/<path>` (owner, 2026-10-19). Tags don't change, so the target
  always exists.
  - It's rendered at the end of the page by the `MarkdownContent` override, from the manifest's ref and path, so
    there's still no new override.
  - Starlight's edit link has one label site-wide, so it can't carry "View source" itself.
- An edit to a released page lands on `main`, so it shows in `/docs/next/` before the next release. That's how Read the
  Docs works, and the edit link's target says so: it opens `main`.
- The global `editLink.baseUrl` stays this repository's, for `/status/` and the blog.

### D8. Search covers the current version only

`next` and `archived` pages set `pagefind: false`, so search results never mix versions or send a reader to an old
page. Before the first release, `/docs/` (from `main`) is indexed as it is today.

- *Alternative: index all versions and filter.* Starlight's search has no version filter without an override.

### D9. A fixture troupe repository tests the versions, in every check (owner, 2026-10-19)

- **The fixture:**
  - `scripts/troupe-fixture.mjs` creates a git repository in a fresh temporary folder, from a short history kept as
    plain Markdown under `tests/fixtures/troupe-docs/`.
  - Its commits are tagged `troupe-v0.1.0`, `troupe-v0.1.1` and `troupe-v0.2.0`, and more commits on `main` follow.
  - Between versions, one page is added, one removed and one renamed, so "the same page in another version" covers
    pages that don't exist there.
  - It has no remote. It's deleted after the build, and never published.
- **The build:**
  - `npm run build:fixture` runs the fixture script, then `astro build` with `TROUPE_DOCS` set to it, into
    `dist-fixture/` (git-ignored).
  - The check's build gate runs both builds, and the link check covers both outputs.
- **The tests:**
  - Playwright gains a second project, `versions`, with its own preview server on `dist-fixture/`, on its own free
    port. It runs the version tests in `tests/e2e/versions.spec.ts`: the menu, banners, sidebars, redirects, edit
    links, search scope and axe, in light and dark.
  - The real build's tests (`tests/e2e/docs.spec.ts`) cover troupe's actual pages, before the first release.
- **The deploy never builds the fixture.** A unit test checks that `deploy.yml` doesn't run `build:fixture` and never
  sets `TROUPE_DOCS`.

### D10. The pages the website keeps move out of `/docs`

- **Status and roadmap:**
  - It becomes `src/content/docs/status.md`, at `/status/`.
  - It's rendered by Starlight like a blog page: the site header, no docs sidebar, no version menu.
  - `siteSection()` gains a third answer, `site`, for pages that belong to neither docs nor blog. The header shows the
    plain wordmark there.
  - `/docs/programme/status-and-roadmap/` redirects to `/status/`.
- **Contributing:**
  - It becomes a sidebar link to `https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md`.
  - `/docs/backstage/contributing/` redirects there.
  - Task 5.2 checks that Astro's static build makes an external redirect. If it can't, the fallback is a one-page meta
    refresh, recorded in the task.
- **The website's copies of the 29 pages are deleted** with `git rm`, so their history stays findable here.

### D11. The deploy starts on troupe's notice, from `main`, and checks links before it publishes

`deploy.yml`:
- **Triggers:** it gains `workflow_dispatch:` with **no inputs**, so nothing from the sender reaches the build.
- **The build job runs:**
  - when `workflow_run` succeeded on a push, as today;
  - or when `github.event_name == 'workflow_dispatch'` and `github.ref == 'refs/heads/main'`.
  - It checks out `workflow_run.head_sha` or `github.sha` respectively.
- **Concurrency:** the build job joins `concurrency: pages-build` with `cancel-in-progress: true`. Every build reads
  the current website `main` and the current troupe, so a newer build makes an older one redundant. The deploy job keeps
  `pages` without cancelling.
- **Link check:** after `withastro/action` builds, a step runs `npm run linkcheck` on `dist/` (the action has already
  installed dependencies and Node). A dispatched build skips CI, so this is what stops a troupe change with a broken
  link from publishing. A failed build leaves the last deploy live.
- **`github-pages`** is limited to `main` (infrastructure), so a dispatch on another ref can't deploy even if the job's
  condition were wrong.

### D12. troupe's notice is one job after release-please

In troupe-run/troupe's `.github/workflows/release.yml`, a job `notify-website`:
- **Runs:** `needs: release-please` with `if: ${{ !cancelled() }}`. It runs on every push to `main`, after any tag that
  push released exists, and even when release-please fails, since `main`'s docs changed either way.
- **Has:** `environment: docs` and `permissions: {}`, with no checkout.
- **Steps:**
  - `actions/create-github-app-token`, pinned to the SHA `release.yml` already uses, with `client-id`, `private-key`,
    `owner: troupe-run`, `repositories: website` and `permission-actions: write`;
  - `gh workflow run deploy.yml -R troupe-run/website --ref main`, with the token as `GH_TOKEN`.
- **Process:**
  - It's a troupe PR, so it follows troupe's workflow: an OpenSpec change in troupe (`website-docs-notice`) citing
    troupe-run/website#23, with signed-off commits.
  - If troupe's guard needs an issue in troupe, follow its fix: open one on the roadmap board, linking #23.
  - It merges after this repository's PR is deployed, so the first dispatch finds `workflow_dispatch`.

### D13. The vocabulary checks follow the glossary to troupe

- **Glossary:**
  - `tests/unit/vocabulary.test.ts`'s `GLOSSARY` becomes the synced copy of troupe's `main` glossary.
  - The sync's manifest names the path: `next/` once a release exists, and the root before.
  - If the manifest is missing, the test fails, saying to run `npm run docs:sync`.
- **Brand guide §6:**
  - It links `https://github.com/troupe-run/troupe/blob/main/docs/prompt-book/glossary.md` and the published page.
  - Its `system` row is the plain term, as troupe's glossary now has it.
  - The term-set tests stay here, since they need the brand guide.
- **What moves to troupe:**
  - The house page and glossary "TBC" checks, and the "project" record for docs pages, are troupe's docs check now
    (`test_user_docs_vocabulary.py`).
  - The website keeps the brand guide's checks.
  - The "project" scan covers `src/content/copy/` and the site's own pages: `src/content/docs/` minus `blog/` and the
    generated `docs/`, which today is `status.md` only.

### D14. The repository describes where the docs are

- **CLAUDE.md, README.md and CONTRIBUTING.md:** `/docs` content is edited in troupe-run/troupe's `docs/`. This
  repository owns the design, the landing page, the blog and `/status/`. `TROUPE_DOCS` previews local troupe edits.
- **`openspec/config.yaml`'s context:**
  - The "every docs page links to its own source" line becomes: every page on `/docs/next/` and the latest release
    links to its source in troupe, and archived versions have no edit link.
  - The line saying a docs page about behaviour cites the troupe spec moves to "troupe's docs check holds the docs
    pages".
- **The site design spec** (`docs/superpowers/specs/…`) is a dated record. This change's specs replace its `/docs`
  source decision, so it isn't edited.

## Risks / Trade-offs

- **[A troupe push breaks the website's build or checks]** Every website CI run builds against troupe's live `main`.
  → troupe's docs check mirrors the site's contract (front matter, links, sections), and the sync's errors name the
  page and the fix. A dispatched deploy that fails leaves the last good site live. troupe's render check (deferred)
  closes the rest.
- **[The website's contract changes and an archived tag no longer builds]** Tags don't change, so a stricter rule here
  can break `/docs/v0.1/`. → The contract lives in one module with the fixture's archived pages under test. A change
  that refuses an old version fails the fixture build, and the error names the version, so it's a deliberate decision
  (keep accepting, or stop publishing that version), not an accident.
- **[Every build needs the network]** → `TROUPE_DOCS` works offline against a local checkout. The fetch failure's
  message says so. There's no silent fallback.
- **[Starlight's sidebar-in-middleware or per-page `editUrl` and `lastUpdated` don't behave as documented]** → Task 1
  proves each one on the real build before the rest is built. If one fails, stop and say so: it's the design spec's 6.4
  revisit trigger.
- **[A fix to a released page shows only in `/docs/next/` until the next release]** → That's Read the Docs' trade-off,
  and the edit link opens `main`, so the writer sees where it lands. Not mitigated further.
- **[A fresh clone's first build is slower]** → A full bare clone of troupe was 2.5 s and 4 MB (2026-10-19). Later runs
  only fetch. If troupe's history grows large, a shallow or partial clone with a batched blob fetch is the next step.
  Task 7.3 records the time.
- **[The dispatch credential is misused]** → The token can only start workflows in website. The deploy takes no inputs,
  builds only `main`, and deploys only through `github-pages`.

## Migration Plan

1. This repository's PR merges and deploys. `/docs` now comes from troupe's `main`, `/status/` exists, and the
   redirects work. This ends #123's freeze.
2. Prove the trigger before troupe sends it: the owner runs `gh workflow run deploy.yml -R troupe-run/website --ref main`
   (or starts it from the Actions tab), and the run builds, checks links and deploys.
3. troupe's PR, with the notice job, merges. Its first run on `main` starts a website deploy. Check that the run
   appears in website's Actions as `workflow_dispatch`, by `troupe-run-docs`.
4. After the merge, comment on #23 with both PRs and the archived change, and close it.

Rollback: revert this repository's commits, which restores the pages from history and the old deploy. troupe's notice
job then fails on a workflow with no `workflow_dispatch`, which fails only that job. Remove it in troupe, or reinstate
the trigger.
