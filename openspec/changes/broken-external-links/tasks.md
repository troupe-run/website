# Tasks

Ordering: groups 1 and 2 use throwaway troupe repositories and the fixture, so they can be built before
troupe-run/troupe#366 lands. Nothing but the planning commit can be committed until it has: `scripts/check.py` builds
against troupe's real `main`, which has the three broken links until then (group 3).

## 1. Finding troupe's repository links in a page

- [x] 1.1 Write unit tests in `tests/unit/troupe-repo-links.test.ts` for turning a URL into a ref and path (design D3):
      `blob` and `tree`, an anchor and a query dropped, percent-decoding, a trailing `/` removed, an empty path, owner
      and repository compared without case. And for what's left alone: an issue, a release, the repository's front
      page, another repository, `raw.githubusercontent.com`, a relative link. Run `npx vitest run
      tests/unit/troupe-repo-links.test.ts` and see them fail because the module doesn't exist.
- [x] 1.2 Write `scripts/troupe-repo-links.mjs` with the parser, and see the 1.1 tests pass.
- [x] 1.3 Add tests that the link collector (design D2) finds an inline link, a reference definition and a GFM
      autolink, and finds nothing in a fenced code block or inline code. Write the collector with
      `@astrojs/markdown-satteri` and a collecting mdast plugin, and see the tests pass. Note in the module whether
      the processor parses synchronously, since 2.3 depends on it.

## 2. Checking the links in the sync

- [x] 2.1 Add `exists(ref, path)` to both sources in `scripts/troupe-docs-lib.mjs` (design D4), one
      `git cat-file --batch-check` per version for git refs and the working tree for a local `main`. Test it in
      `tests/unit/troupe-source.test.ts` with `makeRepo`: a file, a folder, a missing path, a path with `..` that
      leaves the checkout (a problem, not `false`), a tag, a commit, and a file in a local checkout's working tree
      that isn't committed. See the tests pass.
- [x] 2.2 Resolve a link's ref (design D3): `main`, a listed tag or a commit pass, and anything else is a problem that
      names the ref and says to link `main`, a tag or a commit. Test each case and see them pass.
- [x] 2.3 Check the links of each page in versions read from `main` in `buildVersions`, through `refuse` (design D1,
      D5). In `tests/unit/troupe-sync.test.ts`: a missing file fails naming troupe's main, the page, the link and the
      fix; two broken links on two pages are named in one failure; a link at a tag is checked at that tag; a page
      from a release tag with a broken link doesn't fail; a link in a code block isn't checked; and nothing is written
      when the check fails. If 1.3 found the processor async, make `sync` async and await it in `astro.config.mjs`,
      `scripts/troupe-docs.mjs` and the tests. See `npx vitest run` and `npm run check` pass.
- [x] 2.4 In `tests/fixtures/troupe-docs/4-main/docs/`, link a file the fixture has on main with a `blob/main` URL and
      a folder with a `tree/main` URL, and say why in the fixture's README. See `npm run build:fixture` pass.
- [x] 2.5 Show the fixture check can fail: point the 2.4 link at a path the fixture doesn't have, run
      `npm run build:fixture`, and see it fail naming the page, the link and the fix. Restore the link and see it
      pass. Keep both outputs for the pull request.

## 3. Against troupe's real main

- [x] 3.1 Show the check catches #112 for real: run `npm run docs:sync` with `TROUPE_DOCS` set to a troupe checkout at
      the commit before troupe-run/troupe#366's fix, and see it fail naming the three changelog links on
      `docs/backstage/changelog.md` and nothing else. Keep the output for the pull request.
- [x] 3.2 Time `npm run docs:sync` from the clone on `main` and on this branch. See the difference is under a second,
      or raise it in the pull request.
- [x] 3.3 Once troupe-run/troupe#366 is on troupe's `main` (`gh issue view 366 -R troupe-run/troupe` shows it closed
      by a merged pull request), run `npm run docs:sync` and see it pass, then `uv run scripts/check.py` and see it
      pass. Commit.

## Workflow follow-up

- Open a draft pull request that closes #112 and names troupe-run/troupe#366, with the outputs from 2.5, 3.1 and 3.2.
- Act on Claude's review of the last push, mark the pull request ready, archive the change on the branch, and ask the
  owner to merge.
- After the merge, start the weekly external link check by hand (`gh workflow run links-weekly.yml -R
  troupe-run/website`) and see a clean run. Comment on #112 with the pull request, the archived change and the clean
  run, and check its card says Done.
