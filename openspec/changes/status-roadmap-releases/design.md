# Design

## Context

`/status/` is `src/content/docs/status.md`, a page of this repository rendered by Starlight with the docs sidebar
(`versioned-docs`, design D10 of `docs-from-troupe`, and `status-docs-sidebar`). Its text is hand-written.

The build already reads one other repository. The `troupe-docs` integration in `astro.config.mjs` calls `sync()` in
`scripts/troupe-docs-lib.mjs` on `astro:config:setup` for every command but preview. `sync()` keeps a bare clone of
troupe-run/troupe in `.cache/troupe.git` (fetched on every run, or `TROUPE_DOCS` for a local checkout), reads its
release tags (`troupe-vX.Y.Z`), writes the pages, and writes `src/generated/troupe-docs.json`, which the middleware
and components import. Errors that the build won't guess about are `TroupeDocsError`s naming the input and the fix.
The same integration adds a Sätteri mdast plugin (`troupe-links`) to the Markdown processor. Sätteri's plugin context
can replace a node (`replaceNode`).

troupe-run/infrastructure is public. Its `tofu/milestones.json` holds `repositories` and a `milestones` list; each
milestone has `key`, `title`, `state` and `description`. Today the titles are `0.1.0` to `0.20.0` and `1.0.0`, in
version order, every description is `Name: what it adds`, and every state is `open`. OpenTofu applies the file to the
milestones of troupe, infrastructure, website and .github, so a milestone's issue counts are spread over four
repositories.

## Goals / Non-Goals

**Goals:**

- One place to change a release's version or description: `tofu/milestones.json`.
- The page's own words stay in Markdown that the owner reviews as text, and its headings stay in Starlight's
  "On this page", anchors and search as they are now.
- Every input that's wrong stops the build with a message naming the input and the fix.

**Non-Goals:**

- Redeploying the site when a milestone changes. That's a notice from infrastructure, as troupe sends one; it's a
  follow-up issue there (task 1.2).
- Showing which issues belong to which release. The board and the milestones do that.
- Changing any milestone's wording. Descriptions are shown verbatim, so a wording fix (for instance "config", which
  the site's copy rules avoid) is made in `tofu/milestones.json`, where it also fixes GitHub.

## Decisions

**D1. The source is `tofu/milestones.json`, read with git, like troupe's docs.** A second bare clone,
`.cache/infrastructure.git`, is fetched on every run (only `main`, shallow), and the file is read with
`git show main:tofu/milestones.json`. `TROUPE_MILESTONES` names a local infrastructure checkout instead, read from its
working tree. Considered:

- *GitHub's milestones API.* It's what GitHub shows, and it has issue counts. But it needs a token in CI to avoid the
  unauthenticated rate limit, the counts would need adding up over four repositories, and the API is the result of
  applying the file, not the declaration: a milestone changed by hand on GitHub would show here until OpenTofu put it
  back.
- *A test that checks a hand-written list against the file.* It meets #32's "a check fails", but every renumbering
  then needs a second edit here. #32 prefers no second edit.
- *Fetching the raw file over HTTPS.* Simpler than a clone, but the sync is synchronous and already speaks git; a
  second transport would need its own error handling and offline story. A shallow clone of a small repository costs
  little.

The fetch follows `versioned-docs`'s rules for troupe: a failure stops the build with the repository, the git error
and the variable to set, and nothing builds from an older copy.

**D2. Released means troupe has the tag; the first unreleased milestone is current.** The tags are the release, and
`/docs` is already built from them. A milestone's `state` isn't used: closing a milestone is bookkeeping that can lag
or lead the tag, and the page would then disagree with `/docs`. A tag for a version no milestone declares (a patch,
`troupe-v0.1.1`) adds nothing to the list. The sync's manifest gains the list of release tags it read, so the roadmap
uses the exact tags `/docs` was built from, in the same run.

**D3. Order is by version, parsed, not by the file's order.** Titles are parsed as `MAJOR.MINOR.PATCH` and sorted
numerically. The file's order is ignored, so a renumbering that forgets to move the entry still renders in order.

**D4. What's checked, and what's ignored.** Refused, naming `tofu/milestones.json` and the fix: not JSON, no
`milestones` array, a milestone that isn't an object, a title that isn't `MAJOR.MINOR.PATCH` (no leading zeros, no
`v`), a missing or empty description, a duplicate title. Ignored: `key`, `state`, `repositories` and any key added
later. The file belongs to infrastructure and feeds OpenTofu, which may need fields this page doesn't, so refusing
unknown keys would break the site's deploy for a change that doesn't affect it. Everything the page reads is checked;
nothing it doesn't read can change what it shows. This is the closed-schema rule applied to the part of the file the
page consumes.

**D5. The list is rendered into `status.md` by a Sätteri mdast plugin, at a marker.** `status.md` keeps its headings
and prose, and marks where the generated parts go with HTML comments on their own lines:
`<!-- roadmap:status -->` under "Status" and `<!-- roadmap:releases -->` under "Releases", each with a comment beside
it saying the content comes from `tofu/milestones.json` in troupe-run/infrastructure. A `roadmap` plugin, added next
to `troupe-links` and active for `status.md` only, replaces each marker with Markdown nodes: a paragraph for the
status line, and an ordered list for the releases. A page with a marker missing, repeated or unknown fails the build.

The rendered list item is: the version in bold, then the description verbatim, then the marker words in a span the
CSS layer styles (released, or being worked on). For example: **0.1.0** One real actor, safely: an actor defined in
config runs … *Working on now*. The status line is a template in the copy file, with `{latest}` and `{next}`.

Considered:

- *Render the list in the `MarkdownContent` override with an Astro component.* It could use `getCopy()` directly, but
  its headings wouldn't be in Starlight's "On this page", and it can only add content before or after the page body,
  not between the Status and "How to read it" sections without moving the page's prose into components.
- *An `.mdx` page importing a component.* Needs `@astrojs/mdx` with the Sätteri processor, a new dependency for one
  page.
- *Generate `status.md` from a template.* "Improve this page" would then open a generated file, or need a second
  source path.

**D6. The words the list adds live in `src/content/copy/roadmap.md`.** The site's own words are reviewed as text in
`src/content/copy/` (project rule). The file holds the status line before and after the first release, and the two
marker words. The `copy` collection's schema in `src/content.config.ts` gains a `roadmap` section, so Astro checks it;
the plugin reads the same file with `yaml` (already a dev dependency) at plugin creation, since a Sätteri plugin is
synchronous and can't call `getCopy()`.

**D7. Links are page-level, not per release.** "How to read it" links to `https://github.com/troupe-run/troupe/milestones`
and the troupe roadmap board (`https://github.com/orgs/troupe-run/projects/1`). A per-release link would need each
repository's milestone number, which the file doesn't hold, or a board view filtered by milestone, whose URL format is
GitHub's to change. No counts (proposal): a static count is as old as its build.

**D8. Data flow.** In `astro:config:setup`, after `sync()`, the integration calls the milestones reader with the
manifest's release tags. It writes `src/generated/roadmap.json`: the releases in order, each with version, description
and `released`, and the current version (or null when every milestone is released). The plugin reads that file. The
reader is pure apart from the fetch (parse, check, order, mark), so the unit tests drive it with strings.

**D9. Fixture.** `tests/fixtures/milestones.json` holds a short list in a deliberately wrong order (with a 0.10.0 to
test numeric order, and an unknown key). `scripts/troupe-fixture.mjs` writes it into a temporary folder shaped like an
infrastructure checkout (`tofu/milestones.json`) and sets `TROUPE_MILESTONES` to it, as it sets `TROUPE_DOCS`. Its
troupe has `troupe-v0.1.0`, `troupe-v0.1.1` and `troupe-v0.2.0`, so 0.1.0 and 0.2.0 are released, 0.3.0 is current,
and 0.1.1 adds nothing. The regular build reads the live file, and its e2e tests assert only shape (a list exists, in
version order, exactly one current), never live wording.

## Risks / Trade-offs

- [The page lags a milestone change until the next deploy] → Deploys run on every merge here and every push to
  troupe's `main`, which is most days. The follow-up infrastructure notice (task 1.2) removes the lag.
- [A malformed `tofu/milestones.json` blocks every deploy of the site, docs included] → The same is true of a malformed
  troupe tag, by design: a wrong page is worse than a late one. The error names the file and the fix, and infra's own
  checks are the first line. A follow-up in infrastructure could validate the file against the same rules.
- [Milestone descriptions break the site's copy rules ("config")] → They're shown verbatim by design (Non-Goals).
  Task 5.2 asks the owner whether to reword them in infrastructure; the page doesn't rewrite them.
- [Sätteri's `html` node or `replaceNode` behaves differently than expected] → Task 3.1 proves the plugin on a
  one-line page first. The fallback is a paragraph whose whole text is the marker, matched exactly.
- [A second clone slows the build] → Shallow, one branch, one small repository; measured in task 2.4.

## Migration Plan

Merging deploys the new page. Rollback is reverting the merge; nothing outside this repository changes.
