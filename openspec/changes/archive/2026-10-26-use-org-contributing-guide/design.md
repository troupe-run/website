# Design

## Context

`CONTRIBUTING.md` has seven sections: an opening that says the org guide doesn't apply here, fixing or improving a
page (with the outside-fix paragraph), setting up, running it locally, how work flows, commit messages, and licensing.
The org guide in troupe-run/.github now covers the last three for website, plus the outside fix, and says "Setting up
and running a repository is in its README". `README.md` is eight lines of pointers plus a licence section.

Three files name `CONTRIBUTING.md` as this repository's file: `README.md`, `CLAUDE.md` and
`scripts/check-paths.toml`'s `skip` group. The other hits are the org guide's URL (`src/lib/docs-nav.ts` and the tests
that pin the Backstage link), the `contributing` and `versioned-docs` specs, and historical records
(`docs/superpowers/`, archived changes).

`README.md` and `CLAUDE.md` are in the `skip` group: a commit that stages only them doesn't run the check. CI always
runs the full check. `scripts/tests/test_check.py` fails if a gate source (`src`, `tests`, `scripts/*.mjs` and the
root config files) names a skipped path; `scripts/tests/` isn't a gate source in that list.

## Goals / Non-Goals

**Goals:**

- Everything in `CONTRIBUTING.md` that only applies to website survives, in the README.
- Nothing the org guide says is restated here, except where a reader needs it at the point they act: the README's
  licence section, and the one line telling an outside contributor their failing `guard` check is expected.
- A guide of its own coming back, or a link to one, fails the check.

**Non-Goals:**

- The org guide's text (troupe-run/infrastructure, `org-profile/CONTRIBUTING.md`).
- Rewording the setup and running notes beyond what the move needs. They're accurate today, and the move is not the
  place to change them.
- Editing historical records. The original design (`docs/superpowers/specs/…` §4.3) says "`CONTRIBUTING.md` says so"
  about the CLA; the `contributing` spec already replaces that decision, as `openspec/config.yaml` allows.

## Decisions

### D1. The README takes the three sections as they are

The README gains **Setting up**, **Running it locally** and **Fixing or improving a page**, moved from
`CONTRIBUTING.md` with their text unchanged except for references to the file itself ("below", "the workflow
below"). They replace the current "Development" paragraph's pointer to `CONTRIBUTING.md`, which becomes a line linking
the org guide for how work flows, commits, sign-off and contribution terms.

The `TROUPE_MILESTONES` note and the rebuild test go too, though #31's list doesn't name them: they're part of running
it locally, and dropping them would lose documentation.

Alternative: a short README that links a `docs/development.md`. Rejected: the org guide tells readers the README holds
setup, and a second hop for every contributor is the cost of the old arrangement with a new name.

### D2. The outside fix keeps one line here and links the rest

The README's **Fixing or improving a page** keeps the sentence that an outside contributor's pull request fails its
`guard` check and that this is expected, then links
`https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md#a-fix-from-outside` for what the maintainer does.
Someone who just clicked **Improve this page** and saw a red check reads the README's section, not the org guide; the
procedure itself is the org's and stays there.

### D3. CLAUDE.md keeps its workflow and changes one pointer

`CLAUDE.md` keeps "How work happens here" and the no-sign-off line: it's the agent's instructions, and the
`contributing` spec requires both there. Its opening sentence's `[CONTRIBUTING.md](CONTRIBUTING.md) for setting up`
becomes the README for setting up and the org guide for contributing.

### D4. A unittest guards the absence, not the README's wording

`scripts/tests/test_contributing.py` (run by `check.py`'s first gate, `unittest discover -s scripts/tests`) checks:

1. No `CONTRIBUTING.md` at the root, in `.github/` or in `docs/`, the three places GitHub looks (case-insensitively,
   since GitHub matches `contributing.md` too).
2. No file git would commit links to `CONTRIBUTING.md` by a relative path. Markdown link targets and `href`s ending in
   `CONTRIBUTING.md` that aren't `https://` URLs are reported, with the file's path. `docs/superpowers/` and
   `openspec/changes/` are left out: they record what was true when written, and the change in flight quotes the
   old file. The test file itself is left out by its path, since its fixtures are the links it looks for.

Each part is shown to fail first: (1) while `CONTRIBUTING.md` still exists, (2) against the current `README.md` and
`CLAUDE.md`.

The README's content (its sections, the org-guide links, the licence section) isn't asserted by a test. Its scenarios
are checked by reading the README against the spec, and the owner reviews it as text. Pinning prose in a test would
fail on every rewording without catching a wrong instruction.

Alternative: a vitest under `tests/unit/`. Rejected: `tests/` is a gate source, and a gate source that reads
`README.md` or `CLAUDE.md` names a skipped path, which `test_check.py` forbids (quality-check, design D5 of
commit-check-paths).

### D5. `README.md` and `CLAUDE.md` stay skipped; `CONTRIBUTING.md` leaves the list

`scripts/check-paths.toml` drops `CONTRIBUTING.md`: the file won't exist, and a skip entry for a missing file is a
claim about nothing. If one is added again, a commit staging it runs the full check, so D4 refuses it.

`README.md` and `CLAUDE.md` stay in the list, so a commit touching only them still skips the check. The new test reads
them through git's file list, not by naming them, so `test_check.py`'s rule isn't broken, but a docs-only commit that
adds a relative link to `CONTRIBUTING.md` isn't caught until CI's full run on the pull request. That's the trade the
skip group already makes for these files, and catching it at the pull request is enough.

Alternative: take `README.md` out of the skip group. Rejected: every README typo would run the full check, minutes
long, to guard against a mistake CI catches anyway.

## Risks / Trade-offs

- [The org guide changes and stops covering website] → It's written by troupe-run/infrastructure and its table names
  website's licences and "no sign-off". A change there is reviewed there; this repository's README and `CLAUDE.md`
  still say no sign-off on their own.
- [The `#a-fix-from-outside` anchor breaks if the org guide's heading is renamed] → The weekly external link check
  covers README links only if it reads the README; it doesn't (it checks the built site). Accepted: a broken anchor
  still lands on the right page.
- [GitHub caches the community profile] → GitHub's "Contributing" link for website switches to the org guide once the
  deletion is on `main`. Verified after the merge by opening it.

## Migration Plan

One pull request: the README gains the sections, `CLAUDE.md` and `check-paths.toml` change, `CONTRIBUTING.md` is
deleted, and the test is added. Rollback is reverting the pull request.
