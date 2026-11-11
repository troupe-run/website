# Design

## Context

`scripts/troupe-docs-lib.mjs`'s `sync` opens troupe's source (a bare clone of troupe-run/troupe with `main` and every
tag, or the checkout `TROUPE_DOCS` names, whose `main` is its working tree). `buildVersions` reads each version's pages
and refuses a version with any problem through `refuse(version, problems)`, before `writeDocs` writes anything. Links
between pages are rewritten later, at render time, by the Sätteri mdast plugin in `scripts/troupe-links.mjs`, which
sees links as nodes and so never touches code.

Links into troupe's repository by full URL aren't looked at by the build at all. Only the weekly external check
requests them. See proposal.md for why that's too late.

## Goals / Non-Goals

**Goals:**
- A link from a page on troupe's `main` to a path in troupe's repository that doesn't exist stops the build, offline,
  with every such link named at once.
- No new dependency, and no network request beyond the fetch the sync already makes.

**Non-Goals:**
- Pages from release tags. A tag can't be changed, so failing the build on one would block the site with no fix
  available. The weekly check covers them.
- Other GitHub URLs (issues, pull requests, releases, the repository's front page), `raw.githubusercontent.com`, and
  links to other repositories. The weekly check covers them.
- The site's own pages outside /docs. Their links into troupe are few, and the source is only opened for the docs.
- Making troupe's docs check do the same. That's troupe's call; troupe-run/troupe#366 fixes the page and its test.

## Decisions

### D1. Check in the sync, not in the render plugin

The check is a step of `sync` of its own, run on each version read from `main` straight after `buildVersions` has
checked the page contract and before anything is written. Its problems go through `refuse`. (Planned inside
`buildVersions`; a separate step kept `buildVersions` synchronous, so only `sync` became async, with the same refusal.)

- It fails before any page is written, and names every broken link in the version at once, as the page contract does.
- `npm run docs:sync` catches it, not only a full build.
- A render-time check would miss a link when Astro's content cache skips rendering an unchanged page while the file it
  links has gone from troupe (the kind of staleness troupe-run/website#35 dealt with).

Alternative: give `troupeLinks` a lookup and throw from the plugin. Rejected for the three reasons above.

### D2. Find links with the Sätteri processor the site renders with

The sync parses each `main` page with `@astrojs/markdown-satteri` (already a dependency, and already used directly in
`tests/unit/troupe-links.test.ts`) and a collecting mdast plugin that reads `link` and `definition` nodes, as
`troupeLinks` does. So the check sees exactly the links the page renders, GFM autolinks included, and nothing in code.

Alternatives: a regular expression over the Markdown would check URLs inside code blocks, which the spec says to
leave alone. `mdast-util-from-markdown` is in `node_modules` only as a transitive dependency, and would parse
differently from the renderer in edge cases. Both rejected.

The processor only renders asynchronously, so `sync` is async (`buildVersions` stays synchronous; see D1). The Astro
hook that calls `sync` can be async, and `scripts/troupe-docs.mjs` awaits it. The tests that call `sync` await it too.

### D3. Which links, and how a URL becomes a ref and a path

A link is checked when its host is `github.com`, its first two path segments are `troupe-run/troupe` (compared without
case, as GitHub does), and the third is `blob` or `tree`. The fourth segment is the ref and the rest is the path,
percent-decoded, with a trailing `/` removed. The query and anchor are ignored.

- **The ref is one segment.** A branch name with a `/` can't be told apart from the path, so the check doesn't try:
  the ref must be `main`, a tag the source lists, or 7 to 40 hex digits naming exactly one commit, found with
  `git rev-parse --disambiguate`, which reads object ids only. Anything else is a problem naming the ref ("link
  `main`, a tag or a commit"), `HEAD` and other branches included: a checkout has them and CI's clone doesn't, so a
  link at one would pass on a writer's machine and fail in CI. A branch named like a commit id isn't taken for one.
  This follows the rule that an input the check can't read is an error, not a pass.
- **`blob` and `tree` are treated alike.** GitHub redirects a `blob` URL for a folder to `tree`, and the reverse, so a
  path that exists as either passes.
- **An empty path** (`/tree/main`) is the repository's root, and passes.

### D4. Whether a path exists at a ref

The source gains `hasRef(ref)`, which applies D3's rule, and `exists(links)`, which takes a version's
`{ ref, path }` links together and says for each whether the path is a file or folder at its ref:

- **Clone, or a local checkout at a tag or commit:** one `git cat-file --batch-check` per version, with each ref
  resolved by D3's rule, rather than one process per link.
- **Local checkout at `main`:** the working tree, as `listTree` and `readFile` already treat it. `.git` is on disk but
  never in the repository, so it doesn't count.
- **A path with an empty, `.` or `..` part, or a control character,** is a problem, not a lookup. A link's path is
  percent-decoded, so `%2F..` or `%0A` could otherwise reach git.

### D5. The problem's words

Each problem is one line under the existing `refuse` heading ("troupe's main can't be built into /docs:"), in the page
contract's style:

```
docs/backstage/changelog.md: the link https://github.com/troupe-run/troupe/blob/main/plugins/runner-ollama/CHANGELOG.md
  names plugins/runner-ollama/CHANGELOG.md, which isn't at main: link it once it exists, or link a path that does
```

The exact wording is set by the tests in task group 2. These are build errors for troupe's writers, not site copy.

## Risks / Trade-offs

- [A broken link on troupe's `main` blocks every website build, and so every website pull request, until troupe fixes
  it] → The same is already true of the page contract, and it's the point: the break shows on the next pull request,
  not a week later. The message names the page and the fix, and the fix is a one-line troupe change.
- [The check lands red] → It can't land until troupe-run/troupe#366 is on troupe's `main`: `scripts/check.py` builds
  against the real troupe, and the guard runs it before each commit. Task 1.1 waits for it.
- [A link to an unreleased part's changelog comes back] → After #366, troupe's test names an unreleased part without a
  link. If someone links one anyway, this check refuses it.
- [Parsing every `main` page a second time slows the sync] → About thirty pages. Measured in task 3.2.

## Migration Plan

1. troupe-run/troupe#366 merges, so troupe's `main` links only changelogs that exist.
2. This change merges. Its first build checks troupe's real `main`.
3. Start the weekly external check by hand (or wait for Monday's run). A clean run closes #112.

Rollback: revert this change's commit. Nothing outside the build depends on it.
