# Proposal

## Why

troupe-run/troupe#120 decided that troupe owns everything under troupe.run's `/docs`, and that the website builds it
from troupe, one version per release, like Read the Docs (owner, 2026-10-19). troupe's half is done: troupe-run/troupe#128
moved the 29 user-docs pages into troupe's `docs/`, written and tested there. The credential that lets troupe start the
website's build exists, and its key is set (troupe-run/infrastructure#109 and #110, comments on #23). Until this change
lands, the site still serves its own copies, and an edit to those would be lost, so the website's `/docs` is frozen
(troupe-run/troupe#123). This is #23.

## What Changes

- **`/docs` is built from troupe-run/troupe.** Each build fetches troupe's `docs/` for every version and renders it
  in the site's design. The site's own copies of those 29 pages are removed. The pages land in a generated, git-ignored
  folder that Starlight reads as it reads any content, so nothing in Starlight is forked.
- **Versions:**
  - `/docs/…` is the latest release, or troupe's `main` while there's no release.
  - `/docs/vX.Y/…` is each earlier minor release, from its newest `troupe-vX.Y.*` tag.
  - `/docs/next/…` is troupe's `main` once a release exists, marked as unreleased.
- **A version menu on every docs page.** It lists every version, and each entry opens the same page in that version
  when it exists there. Archived and unreleased pages say which version they describe and link to the latest. The
  sidebar of each version lists that version's pages. Search covers the current docs only.
- **The page contract matches troupe's.** The site accepts exactly the front-matter keys troupe's docs check allows
  (`title`, `description`, `status`, `prerelease`, `purpose`). An unknown key, a page outside the six sections, or a
  file that isn't `.md` stops the build, naming the version, the page and the fix. Links between pages are written as
  `.md` paths in troupe, so they work on GitHub, and they're rewritten to the site's URLs.
- **"Improve this page"** opens the page's source on troupe-run/troupe's `main`, not here, on `/docs/next/` and the
  latest release. Archived pages link "View source" to the page at their tag instead. "Last updated" comes from troupe's
  git history for that page and version.
- **Rebuilds on troupe's notice:**
  - The deploy workflow gains `workflow_dispatch`, with no inputs, and deploys only from `main`.
  - Before publishing, it checks the built site's internal links, since a dispatched build has had no CI run.
  - troupe's release workflow gains a job, after release-please, that sends the notice with the `troupe-run-docs`
    App's token, on every push to troupe's `main`. That covers new tags, since release-please creates them in that
    same run. That job is a small PR in troupe-run/troupe, following troupe's own workflow.
- **What stays here moves out of `/docs`:**
  - **Status and roadmap** becomes the site's own page at `/status/`, and `/docs/programme/status-and-roadmap/`
    redirects there. troupe's "What is troupe?" links that old URL.
  - **Contributing** becomes a sidebar link to the org's
    [CONTRIBUTING.md](https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md), and its old URL redirects there.
- **The rest #128 left for #23:**
  - The brand guide's §6 links the glossary at its source in troupe, and its `system` row is a plain term, as troupe's
    glossary now has it.
  - `tests/unit/vocabulary.test.ts` reads the glossary troupe's `main` has. Its docs-page checks (the house page, the
    "project" record for docs pages) move out, since troupe's docs check now holds them. Landing copy and the site's own
    pages stay checked here.
- **The repository's own description changes with it:**
  - CLAUDE.md, README.md and CONTRIBUTING.md say where the docs' source is now.
  - `openspec/config.yaml`'s context says that troupe owns `/docs`, and the website owns the design.

### Owner decisions (2026-10-19)

1. **Status and roadmap's new URL is `/status/`.**
2. **"Improve this page" appears only on `/docs/next/` and the latest release** (`/docs/…`), not on archived versions.
   Tags don't change, so an archived page has nothing to edit. An archived page has a **"View source"** link instead,
   to the page at its tag, which always exists. Every docs page still links to its own source: an edit link where it
   can be edited, and a link to the source otherwise. `openspec/config.yaml` says so.
3. **The check also builds the site against a fixture troupe repository with tags** (design D9). It's made fresh in a
   temporary folder on each run, has no remote, and is never published: the deploy builds only from
   troupe-run/troupe. Until troupe releases, this is the only build with `/docs/next/` and archived versions.

## Capabilities

### New Capabilities

- `versioned-docs`: how `/docs` is built from troupe-run/troupe. It covers where the pages come from, which versions
  exist and at which URLs, the page contract, the version menu, banners and sidebars, edit links and dates, search
  scope, and the pages that stay with the website.

### Modified Capabilities

- `build-and-deploy`: the deploy can also be started by troupe's notice, from `main` only, and checks internal links
  before it publishes.
- `vocabulary`: the glossary is troupe's `docs/prompt-book/glossary.md`. The brand guide links it there. The
  website's checks cover the brand guide, the landing copy and the site's own pages, and troupe's docs check covers the
  docs pages.
- `quality-check`: the build gate also builds the site against a fixture troupe repository with tags, and the
  end-to-end tests also run against that build.

## Impact

- **Code:**
  - `astro.config.mjs`: a small integration runs the sync and adds the version redirects, and the sidebar changes.
  - `src/content.config.ts`, `src/route-middleware.ts`, `src/components/docs/MarkdownContent.astro` and
    `src/lib/site-section.ts` change.
  - New files: `scripts/troupe-docs.mjs`, its library, and a remark plugin.
  - `.gitignore` adds the generated docs folder and the clone cache.
- **Content:** the 29 pages and `backstage/contributing.md` under `src/content/docs/docs/` are removed, and
  `src/content/docs/status.md` is added.
- **Workflows:** `.github/workflows/deploy.yml` changes. In troupe-run/troupe, `.github/workflows/release.yml` gains the
  notice job, through its own issue and OpenSpec change, and with signed-off commits as troupe requires.
- **Tests:**
  - `tests/e2e/docs.spec.ts` is rewritten for the fetched pages, the versions and the redirects.
  - New unit tests for choosing the versions, the front-matter contract, link rewriting and the sidebar.
  - `tests/unit/vocabulary.test.ts` changes.
- **Docs:** `docs/brand-guide.md` §6, CLAUDE.md, README.md, CONTRIBUTING.md and `openspec/config.yaml`.
- **Dependencies:** none new. The sync uses `git`, which every build environment already has.
- **Network:** every build, CI run and local check now fetches troupe-run/troupe, which is public. Offline, or to
  preview troupe's docs before they're pushed, `TROUPE_DOCS` points the build at a local troupe checkout.
- **Coupling:** the website's CI now builds against troupe's live `main`. A troupe change that breaks the site's build
  turns the website's checks red too, until troupe's render check exists (deferred on troupe-run/troupe#128).
- **Order:**
  - The website's PR merges first, so the deploy accepts `workflow_dispatch` before troupe sends it.
  - troupe's PR follows.
  - #123's freeze on the website's `/docs` ends when this change deploys.
- **Rollback:**
  - Revert this repository's commits, which restores the site's own pages from history.
  - Remove troupe's notice job, or leave it: a dispatch to a workflow without `workflow_dispatch` fails only troupe's
    notice job.
