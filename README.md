![troupe](brand/out/readme-banner.png)

# website
troupe.run — website and landing page

## Development

This repository follows [troupe-run's contributing guide](https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md),
like every repository in the org: it says how work flows, how commit messages are written, and the terms
contributions come in on. There's no sign-off here. [CLAUDE.md](CLAUDE.md) has the workflow for coding agents.
`/docs` is built from [troupe-run/troupe](https://github.com/troupe-run/troupe)'s `docs/`, one version per release:
edit the docs there.
Design: `docs/superpowers/specs/2026-10-07-troupe-run-site-design.md`.
Brand: `docs/brand-guide.md`.

## Setting up

- [uv](https://docs.astral.sh/uv/getting-started/installation/), which runs the check (`brew install uv` on a Mac).
- Node 26 or later (the version in `.nvmrc`), then `npm ci`, which installs exactly what `package-lock.json` lists.
- git, and a network connection: every build fetches troupe-run/troupe for `/docs` (below).

## Running it locally

- `npm run dev` serves the site at http://localhost:4321.
- Every Astro command (`dev`, `check`, `build`) first fetches troupe-run/troupe into `.cache/` and writes `/docs`'s
  pages into `src/content/docs/docs/`, one folder per version, and `/protocol/`'s schemas, from troupe's
  `protocol/schemas/`, into `public/protocol/`, one folder per copy. All three are git-ignored and rewritten on each
  run, so an edit there is lost: edit the page or the schema in troupe. `npm run docs:sync` does just that step.
  - To preview troupe edits you haven't pushed, or to work offline, set `TROUPE_DOCS` to your troupe checkout:
    `TROUPE_DOCS=../troupe npm run dev`. Its working tree is `main`, for the docs and the schemas alike, and its tags
    are the releases (`troupe-v*` for the docs, `protocol-v*` for the schemas).
- The same step fetches troupe-run/infrastructure's `main` into `.cache/` and reads `tofu/milestones.json`, the
  release list on `/status/`. A release's wording is changed there, not here.
  - To preview a milestone edit, or to work offline, set `TROUPE_MILESTONES` to your infrastructure checkout:
    `TROUPE_MILESTONES=../infrastructure npm run dev`. Its working tree is read, uncommitted edits included.
- `uv run scripts/check.py` runs every check CI runs, in the same order: `npm ci`, Playwright's browser,
  `astro check`, the unit tests, the build, the fixture build, the rebuild test, the brand-asset check, the internal
  link check of both builds (with the check of every reference in `/protocol/`'s schemas) and the end-to-end tests.
  It stops at the first failure and says which one. `npm ci` reinstalls `node_modules`, so a dev server that's
  running at the time may need a restart.
- The fixture build (`npm run build:fixture`) builds the site into `dist-fixture/` against a throwaway troupe with
  releases, made from `tests/fixtures/troupe-docs/`, so `/docs/next/`, earlier versions, the version menu and every
  `/protocol/` copy are tested before troupe has a release. It's never published.
- The rebuild test (`npm run test:rebuild`) builds the fixture site three times on one content store, as the deploy
  does on a restored cache. The second build changes only the milestones and the third only troupe's tags, and each
  time `/status/` and `/protocol/` must show the new data, not what an earlier build rendered.
- `npm run test:unit` and `npm run test:e2e` run the tests on their own. The e2e suite builds the site and serves it
  on a port that's free at the time (`E2E_PORT` chooses one), so it never reuses your dev server or another
  worktree's. It serves `dist-fixture/` on a second port (`E2E_FIXTURE_PORT`), so run `npm run build:fixture` first.
  `npm run preview` serves a build on 4321 for you.
- Brand images are rendered from `brand/`. If you change anything there, run `npm run assets:render` and commit
  the results. The check makes sure they match.

## Fixing or improving a page

- **A docs page** (`/docs/…`): its **Improve this page** link opens its source in troupe-run/troupe, where the org's
  guide applies, sign-off included. Each earlier release's pages (`/docs/v0.1/…`) link **View source** at their tag
  instead: they can't change, so a fix goes to the current page.
- **Any other page** (the blog, Status and roadmap): its **Improve this page** link opens its source here. If you
  don't have write access, GitHub makes a fork and a pull request for you.

Your pull request's `guard` check will fail, and that's expected. The check wants every change to arrive through
the org's workflow, on a branch named after an OpenSpec change, and GitHub's editor can't do that. The org guide's
[A fix from outside](https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md#a-fix-from-outside) says what
happens to your fix next. You don't need to do anything else.

## Licence

- **Site code** (templates, components, styles, scripts, build config): [MIT](LICENSE).
- **Content** (page copy, docs prose, images and diagrams): [CC BY 4.0](LICENSE-CONTENT).
- **The troupe name, logo and mark** are trademarks of HPS.GD PTY LTD and are not licensed under either of the above.

Contributions come in on the same terms, with no separate agreement to sign: see the org guide's
[Licence and sign-off](https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md#licence-and-sign-off).

Copyright © 2026 HPS.GD PTY LTD.
