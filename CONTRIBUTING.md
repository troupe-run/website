# Contributing to troupe.run

Thanks for helping. This repo is the troupe.run website: the landing page, the blog, Status and roadmap, and the
design that `/docs` is rendered in. The text of `/docs` lives in [troupe-run/troupe](https://github.com/troupe-run/troupe)'s
`docs/`, so it changes with troupe itself. This repo has its own guide, so the org-wide one in
[troupe-run/.github](https://github.com/troupe-run/.github) doesn't apply here: in particular, there's no sign-off.

## Fixing or improving a page

- **A docs page** (`/docs/…`): its **Improve this page** link opens its source in troupe-run/troupe, where the org's
  guide applies, sign-off included. Each earlier release's pages (`/docs/v0.1/…`) link **View source** at their tag
  instead: they can't change, so a fix goes to the current page.
- **Any other page** (the blog, Status and roadmap): its **Improve this page** link opens its source here. If you
  don't have write access, GitHub makes a fork and a pull request for you.

Your pull request's `guard` check will fail, and that's expected. The check wants every change to arrive through
the workflow below, on a branch named after an OpenSpec change, and GitHub's editor can't do that. A maintainer
carries your fix through it instead: they put it on a change branch of their own, credit you as its co-author with a
`Co-authored-by:` line, link your pull request from theirs, and close yours when theirs merges. You don't need to do
anything else.

## Setting up

- [uv](https://docs.astral.sh/uv/getting-started/installation/), which runs the check (`brew install uv` on a Mac).
- Node 22 or later (the version in `.nvmrc`), then `npm ci`, which installs exactly what `package-lock.json` lists.
- git, and a network connection: every build fetches troupe-run/troupe for `/docs` (below).

## Running it locally

- `npm run dev` serves the site at http://localhost:4321.
- Every Astro command (`dev`, `check`, `build`) first fetches troupe-run/troupe into `.cache/` and writes `/docs`'s
  pages into `src/content/docs/docs/`, one folder per version. Both are git-ignored and rewritten on each run, so an
  edit there is lost: edit the page in troupe. `npm run docs:sync` does just that step.
  - To preview troupe edits you haven't pushed, or to work offline, set `TROUPE_DOCS` to your troupe checkout:
    `TROUPE_DOCS=../troupe npm run dev`. Its working tree is `main`, and its tags are the releases.
- `uv run scripts/check.py` runs every check CI runs, in the same order: `npm ci`, Playwright's browser,
  `astro check`, the unit tests, the build, the fixture build, the brand-asset check, the internal link check of
  both builds and the end-to-end tests. It stops at the first failure and says which one. `npm ci` reinstalls
  `node_modules`, so a dev server that's running at the time may need a restart.
- The fixture build (`npm run build:fixture`) builds the site into `dist-fixture/` against a throwaway troupe with
  releases, made from `tests/fixtures/troupe-docs/`, so `/docs/next/`, earlier versions and the version menu are
  tested before troupe has a release. It's never published.
- `npm run test:unit` and `npm run test:e2e` run the tests on their own. The e2e suite builds the site and serves it
  on a port that's free at the time (`E2E_PORT` chooses one), so it never reuses your dev server or another
  worktree's. It serves `dist-fixture/` on a second port (`E2E_FIXTURE_PORT`), so run `npm run build:fixture` first.
  `npm run preview` serves a build on 4321 for you.
- Brand images are rendered from `brand/`. If you change anything there, run `npm run assets:render` and commit
  the results. The check makes sure they match.

## How work flows

Every change follows one path. Git hooks and Claude Code hooks, delivered from
[troupe-run/infrastructure](https://github.com/troupe-run/infrastructure), enforce it, and
[development-workflow.md](https://github.com/troupe-run/infrastructure/blob/main/docs/development-workflow.md) lists
every rule.

1. **An issue says what and why.**
2. **An OpenSpec change says how.** It lives under `openspec/changes/<name>/`, on a branch named exactly `<name>`,
   with a proposal, spec deltas, a design and tasks. Its proposal cites the issue.
3. **A pull request delivers it.** It closes the issue (`Closes #12`). Specs, code and tests change together, and
   `uv run scripts/check.py` passes before every commit.
4. **Before the merge,** the change is archived on its branch, which updates `openspec/specs/`. The pull request is
   merged by rebase.
5. **After the merge,** the issue gets a comment linking the pull request and the change.

Commit messages are [Conventional Commits](https://www.conventionalcommits.org/): `feat(docs): ...`,
`fix(header): ...`, `ci: ...`.

## Licensing of contributions

Contributions to this repo are accepted under its own licences: MIT for code (`LICENSE`) and CC BY 4.0 for
content (`LICENSE-CONTENT`). There's no separate agreement to sign and no sign-off: no DCO, no CLA. troupe's product
repo ([troupe-run/troupe](https://github.com/troupe-run/troupe)) asks for a Developer Certificate of Origin
sign-off on each commit (`git commit -s`); this site does not.

The troupe name, logo, mark and characters are trademarks of HPS.GD PTY LTD and aren't covered by either
licence.
