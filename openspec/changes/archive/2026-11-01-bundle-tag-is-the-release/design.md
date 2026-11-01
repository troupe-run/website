# Design

## Context

Two modules each hold their own idea of the release tag (see proposal.md, Why):

- `scripts/troupe-docs-lib.mjs` has `RELEASE_PREFIX = 'troupe-v'` and `RELEASE`, a pattern for
  `troupe-vMAJOR.MINOR.PATCH`. `chooseVersions` picks `/docs/`, `/docs/next/` and the archived minors from tags that
  start with the prefix, and throws on one that starts with it but doesn't match. `sync` filters troupe's tags by the
  same prefix into the manifest's `releases` (`src/generated/troupe-docs.json`), with each tag's date.
- `scripts/roadmap-lib.mjs` has `RELEASE_TAG`, its own copy of the pattern with a capture group for the version.
  `astro.config.mjs` passes it `manifest.releases`, and `readRoadmap` takes each tag's version and date from it,
  skipping a tag the pattern doesn't match.

troupe's tags today (2026-11-01): `troupe-run-v0.1.0` at `46f3e9a`, `troupe-v0.1.0` at `399a9e7`, `protocol-v0.1.0`,
and one `<component>-v0.1.0` per adapter and runner. Component names start `troupe-` (`troupe-runner-scripted`,
`troupe-vcs-git`, …), so a prefix test has to be exact: `troupe-runner-scripted-v0.1.0` must not read as a bundle tag.
The old prefix wasn't: `troupe-vcs-files-v0.1.0` starts `troupe-v`, so `chooseVersions` refuses it, and every deploy
since troupe's component releases (2026-11-01 05:46 UTC) has failed with "troupe-vcs-files-v0.1.0 isn't a release tag
troupe.run can build". The unit tests name `troupe-vcs-*` tags for that reason.

troupe's release workflow dispatches the deploy after release-please on every push to `main`. The bundle is released by
release-please on the push that merges the pin pull request (troupe-run/troupe#218, point 3), so that push dispatches a
deploy with the new `troupe-run-v*` tag already made. Nothing outside this repository changes.

## Goals / Non-Goals

**Goals:**
- One definition of the release tag that both `/docs/` and `/status/` use, so they can't disagree again.
- Tests that fail if either reads core's tag, at the unit level and on the fixture build.

**Non-Goals:**
- Showing component versions anywhere (core's, an adapter's). The site names the bundle's version only.
- Changing the version menu's or banners' words: they name `vMAJOR.MINOR`, which is now the bundle's.
- The protocol's tags and `scripts/protocol-lib.mjs`.

## Decisions

### D1. One module defines the release tag

A new `scripts/release-tag.mjs` exports the prefix (`troupe-run-v`), the accepted form for error messages
(`troupe-run-vMAJOR.MINOR.PATCH`), and one function that reads a tag: it returns `null` for a tag that isn't a bundle
tag, the version's three numbers for one that is, and throws a `TroupeDocsError` naming the tag and the form for one
that starts with the prefix but is malformed. `troupe-docs-lib.mjs` uses it in `chooseVersions` and in `sync`'s filter;
`roadmap-lib.mjs` uses it in place of `RELEASE_TAG`, skipping `null`.

*Why:* the bug is two copies of one fact. Moving the fact to one place is the fix that stops it recurring
(single source of truth for a decision that may change again).

*Alternatives:* changing both constants in place is smaller, but leaves two copies to drift. Having the roadmap trust
`manifest.releases` without parsing loses its check on the tag's form when it's called directly, as its unit tests do.
The roadmap's own date check stays where it is: it's about the date, not the tag.

### D2. Core's tags are another component's, and ignored

`troupe-v*` gets no special case: like `protocol-v*` or `troupe-vcs-git-v*`, it's simply not the release.
A malformed core tag such as `troupe-v1.0.0-rc.1` no longer stops the build. That's the existing rule ("Tags of
troupe's other components SHALL be ignored") applied to core now that core is one component among several.

*Alternative:* keep refusing malformed core tags as a safety net. Rejected: the site doesn't read them, so refusing one
would stop the deploy over a tag that changes nothing on the site.

### D3. The fixture troupe disagrees on purpose

The fixture's steps become:

| Step | Tags |
|---|---|
| `1-troupe-run-v0.1.0+troupe-v0.1.0+protocol-v0.1.0` | bundle 0.1.0, core 0.1.0 on the same commit |
| `2-troupe-run-v0.1.1+troupe-v0.3.0+protocol-v0.2.0` | bundle 0.1.1, and core 0.3.0, higher than any bundle tag |
| `3-troupe-run-v0.2.0+protocol-v1.0.0` | bundle 0.2.0, with no core release |
| `4-main` | |

If either reader took core's tag, the fixture build would show it: `/docs/` would be v0.3 built from step 2, there'd
be no `/docs/v0.1/` at `troupe-run-v0.1.1`, and `/status/` would mark the fixture milestone 0.3.0 released. The
existing end-to-end tests already assert the bundle's answers (`/docs/` at step 3, `/docs/v0.1/` at step 2, 0.3.0
under "Milestones"), so they become the falsifying tests with no new assertion; a new test names that the core tag
was ignored, so the reason for the fixture's shape is written down. Each page's "at <tag>" line names the bundle tag.

*Alternative:* bundle tags only. Rejected: the tests would pass whether the code read `troupe-v` or `troupe-run-v`
when only one kind exists, and the property this change is for would go unchecked.

### D4. The rebuild test tags the bundle

`scripts/rebuild-test.mjs`'s second rebuild adds `troupe-run-v0.2.1` (and `protocol-v1.0.1`) on
`troupe-run-v0.2.0`'s commit, and checks the status line names 0.2.1, as now.

## Risks / Trade-offs

- [The next deploy changes `/docs/`'s content with no version change: both are 0.1.0, but the bundle's commit is
  later.] → That's the fix. The pull request says so, and the deploy after merging is checked by opening `/docs/` and
  its install page.
- [A future component named so its tag starts `troupe-run-v`, as `troupe-vcs-*` starts `troupe-v` today.] → Only a
  component whose name starts `troupe-run-v` would collide, such as a hypothetical `troupe-run-vscode`. That would stop
  the build by name, not pass silently, as the old prefix did with `troupe-vcs-files`. If such a component appears, the
  release form here needs changing with it.
- [Test fixtures hand-written in the unit tests drift from troupe's real tags.] → They copy the real names seen on
  troupe today (`troupe-run-v0.1.0`, `troupe-v0.1.0`, `troupe-runner-scripted-v0.1.0`).

## Migration Plan

Merge, and the deploy that follows CI builds from `troupe-run-v*`. Check `/docs/`'s install page and `/status/` on
troupe.run after it. Rollback is reverting the pull request; nothing is stored between builds that this changes.
