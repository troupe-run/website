# Design

## Context

`scripts/tests/test_check.py` builds `GATE_SOURCES` at import with `rglob` over `src/` and `tests/`, plus
`scripts/*.mjs` and four config files at the root. `test_no_gate_source_names_a_skipped_file` reads each one and
reports any that names a path in `scripts/check-paths.toml`'s `skip` group. `rglob` sees everything on disk, so after
`npm run docs:sync` it also reads `src/content/docs/docs/` (and `src/generated/`), which `.gitignore` lists. See
proposal.md for why that breaks local commits.

The tests are standard library only and run as `check.py`'s first gate, from the repository root, in a git checkout
both locally (a clone or a worktree) and in CI (`actions/checkout`).

## Goals / Non-Goals

**Goals:**

- The gate-source list is what git would commit, so a build can't change the test's result.
- The rule is checked by a test that can fail: an ignored file naming a skipped path isn't reported, a tracked or new
  file naming it is.

**Non-Goals:**

- The needles (the skipped paths and the files under them) stay as they are. Which files the skip entries cover isn't
  what #36 is about, and an ignored file under `.claude/` as a needle can only add a false report, never hide one.
- Holding troupe's docs pages to this rule. They're written and checked in troupe; nothing here gates on what they
  say.
- Changing `scripts/check-paths.toml`, `check.py`, or the guard (delivered from infrastructure).

## Decisions

### D1. Ask git which files count, rather than naming the ignored folders

The list comes from `git ls-files --cached --others --exclude-standard` over the same paths as today (`src`,
`tests`, `scripts/*.mjs` and the four config files), keeping only paths that are files on disk.

- `--cached` keeps tracked files; `--others --exclude-standard` adds new files that aren't ignored yet, so a file
  written but not yet staged is still checked before its first commit. Without `--others`, the guard's pre-commit run
  would still see it (it's staged by then), but a plain `check.py` run before `git add` wouldn't.
- The on-disk filter drops tracked files deleted in the working tree, as `is_file()` does now.

Alternative: leave out `src/content/docs/docs/` by name. The issue allows it, and it's one line, but it copies a
`.gitignore` entry into the test, and the next ignored folder (`src/generated/` already is one) needs the same edit or
quietly comes back. Asking git keeps `.gitignore` the single source.

Alternative: `git check-ignore --stdin` over the `rglob` list. Same result, but it still walks `node_modules`-sized
trees only to throw them away, and needs a second pass to keep files git would add. `ls-files` answers the question
directly.

### D2. When git can't list the files, the test fails and says so

If `git` isn't on `PATH`, or the root isn't a git checkout, the listing raises an error that names git and the
directory, and the test fails with it. Falling back to `rglob` would bring back the failure this change fixes; an empty
list would make the test pass without checking anything. Both are silent wrong answers (rule: a malformed input is an
error, never a fall-through). Every place the check runs today is a git checkout, so this costs nothing in practice.

### D3. The listing and the matching take a root, so a throwaway repository can test them

`GATE_SOURCES` becomes a function of a root directory, and the matching (sources × needles → findings) becomes a
function too. The existing test calls them with `ROOT`; new tests call them on a temporary `git init` repository with
its own `.gitignore`, holding an ignored page, a tracked file and an untracked file, each naming `CLAUDE.md`. That
shows the rule without depending on whether this machine has built the site, or on what troupe's docs say today.

## Risks / Trade-offs

- [A gate starts reading an ignored file that names a skipped path] → It can't break unchecked: an ignored file isn't
  in any commit, so the guard's skip decision never depends on it. The skip list's purpose (design D5 of the change
  that added it) is unchanged.
- [`git` is a new runtime dependency of the check's tests] → `check.py` already runs git to turn the hooks on, and
  the tests already `git init` temporary repositories. D2 makes its absence a clear failure.
