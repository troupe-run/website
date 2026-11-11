# Proposal

## Why

The weekly external link check (#112) found three 404s on `/docs/next/backstage/changelog/`. troupe's changelog page
links the changelogs of runner-ollama, runner-openai and troupe-plugin-sdk, which haven't had a first release, so
release-please hasn't written them. troupe's own test asked for those links. The page text is troupe's, so the links
are fixed there: troupe-run/troupe#366.

What this repository can fix is how late the break showed up. A link from a docs page into troupe's repository names a
file the build already has, in the troupe clone it reads the pages from. Yet nothing looked until the weekly check, a
week later, as an issue. The build can check those links offline, on every pull request, with no request to GitHub.

## What Changes

- The docs sync checks every link from a page on troupe's `main` into troupe's repository
  (`https://github.com/troupe-run/troupe/blob/<ref>/<path>` or `/tree/<ref>/<path>`). Each one must name a ref the
  clone has (`main`, a tag or a commit) and a path that exists at that ref. A link that fails stops the build, naming
  the page, the link and the fix, with every such link in the version listed at once.
- Links in code are left alone, as the page renderer leaves them. Pages from release tags aren't checked: a tag can't
  be fixed, so the weekly external check stays their safety net.
- With `TROUPE_DOCS` set, `main` is the working tree, as it already is for the pages, so a file added but not yet
  committed counts.
- This change lands only after troupe-run/troupe#366 is on troupe's `main`. Until then troupe's `main` has the three
  broken links, and the new check would fail this repository's build (and `scripts/check.py`, which the guard runs
  before each commit).
- The skip list for the external check stays empty. #112 closes itself on the next clean weekly run, or one started by
  hand after both changes are merged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `versioned-docs`: adds a requirement that links from troupe's `main` into troupe's repository lead to something
  that exists, checked by the build.

## Impact

- `scripts/troupe-docs-lib.mjs`: the source gains a way to ask whether a path exists at a ref, and the sync checks the
  links of each page read from `main` before writing anything.
- Unit tests (`tests/unit/`) for the check, with throwaway troupe repositories, as the sync's tests already use.
- `tests/fixtures/troupe-docs/`: a `main` page links a file the fixture has, so the fixture build exercises the check.
- No new dependency: links are found with the Markdown processor the site already renders with.
- Depends on troupe-run/troupe#366 landing first.
