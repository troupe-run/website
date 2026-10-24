# quality-check Specification

## Purpose

One command, `uv run scripts/check.py`, runs every gate CI runs, in CI's order, on a contributor's machine and in CI,
so the two can't diverge. The guard runs it before each commit and quotes its failure line.

## Requirements

### Requirement: The check runs CI's gates in CI's order
`uv run scripts/check.py` SHALL run, in this order: its own tests, install dependencies from the lockfile, install
Playwright's Chromium, `astro check`, the unit tests, the build, the fixture build, the brand-asset verification, the
internal link check of both builds, and the end-to-end tests of both builds. It SHALL need only uv, Node, npm and git,
and no Python package beyond the standard library.

#### Scenario: Every gate passes
- **WHEN** a contributor runs `uv run scripts/check.py` on a working tree where every gate passes
- **THEN** each gate runs once, in the order above, each is reported as passed with its time, and the command exits 0

#### Scenario: No Python packages to install
- **WHEN** `scripts/check.py` is run on a machine with uv, Node and npm and no project Python environment
- **THEN** it runs without installing any Python package

### Requirement: The check stops at the first failure and names it
When a gate fails, the check SHALL run no later gate, SHALL print `check: <gate> failed` followed by the gate's exit
code and time, and SHALL exit with that gate's non-zero exit code.

#### Scenario: A gate fails
- **WHEN** the unit tests fail
- **THEN** the build and every later gate don't run, the output's last line starts with `check: unit tests failed`,
  and the exit code is the unit tests' exit code

#### Scenario: A gate's tool is missing
- **WHEN** `npm` or `npx` isn't on the PATH
- **THEN** the check exits non-zero with a line that starts with `check:`, names the missing tool and says how to
  install it, and runs no gate

### Requirement: The check refuses arguments it doesn't take
The check SHALL take no arguments. Any argument, including `--scope`, SHALL be refused with a usage error and a
non-zero exit, before any gate runs, because this repository declares no scopes.

#### Scenario: An unexpected argument
- **WHEN** a contributor runs `uv run scripts/check.py --scope docs`
- **THEN** it exits non-zero with a usage error and runs no gate

### Requirement: CI runs the same check
CI's `test` job SHALL run `uv run scripts/check.py` for every pull request and every push to `main`, and SHALL NOT run
any of its gates as a separate step. The job SHALL keep the name `test`.

#### Scenario: A pull request's CI
- **WHEN** a pull request is opened or updated
- **THEN** the `test` job's gate output comes from `scripts/check.py`, and the job fails exactly when the check fails

### Requirement: The check turns the git hooks on once the guard is present
When `scripts/guard.py` exists and the working tree is a git checkout, the check SHALL turn the repository's git hooks
on through the guard and print the guard's notice when it changed anything. When `scripts/guard.py` is absent, or the
tree isn't a git checkout, it SHALL leave git's configuration alone and still run every gate.

#### Scenario: Before the guard is delivered
- **WHEN** the check runs in a clone with no `scripts/guard.py`
- **THEN** `core.hooksPath` is unchanged and every gate runs

#### Scenario: After the guard is delivered, in a fresh clone
- **WHEN** the check runs in a clone that has `scripts/guard.py` and no `core.hooksPath`
- **THEN** the guard's activation runs, its notice is printed with a `check:` prefix, and every gate runs

#### Scenario: Not a git checkout
- **WHEN** the check runs in an unpacked source archive that has `scripts/guard.py`
- **THEN** no git configuration is written and every gate runs

### Requirement: Paths no gate reads skip the check
`scripts/check-paths.toml` SHALL declare `version = 1` and a `skip` group listing only paths that no gate reads,
including `openspec/**`. It SHALL declare no scopes. A commit that stages only skipped paths needs no check; any other
commit needs the full check. The check's own tests SHALL fail when a gate's source names a skipped path. A gate's
sources are the files git would commit, tracked or new; files git ignores, such as the docs each build fetches from
troupe, are not.

#### Scenario: An OpenSpec-only commit
- **WHEN** a commit stages only files under `openspec/`
- **THEN** the declaration says no check is needed

#### Scenario: A commit that touches the site
- **WHEN** a commit stages a file under `openspec/` and a file under `src/`
- **THEN** the declaration says the full check is needed

#### Scenario: CI ignores the declaration
- **WHEN** a pull request changes only skipped paths
- **THEN** CI's `test` job still runs the full check

#### Scenario: A tracked gate source names a skipped path
- **WHEN** a tracked file under `src/`, or a new file there that git doesn't ignore, names `CLAUDE.md`
- **THEN** the check's tests fail and name that file and `CLAUDE.md`

#### Scenario: A fetched docs page names a skipped path
- **WHEN** the site has been built, so `src/content/docs/docs/` holds troupe's docs, and one of those pages names
  `CLAUDE.md`
- **THEN** the check's tests pass, without the folder being deleted first

#### Scenario: Git can't list the gate sources
- **WHEN** the check's tests run outside a git checkout, or without git
- **THEN** the test that reads the gate sources fails and says git couldn't list them, rather than reading every file
  or none

### Requirement: The end-to-end tests run wherever the check runs
The end-to-end tests SHALL start their own preview server in the foreground and stop it when they finish, including
inside a coding agent's session. Each run SHALL use a port that's free when it starts, unless `E2E_PORT` names one, so
runs in two worktrees at once don't collide. An `E2E_PORT` that isn't a whole number from 1024 to 65535 SHALL be
refused, naming the variable, its value and what's valid.

#### Scenario: Inside a coding agent's session
- **WHEN** the check runs in a Claude Code session (`CLAUDECODE=1`)
- **THEN** the end-to-end tests pass, and no preview server is left running afterwards

#### Scenario: Two worktrees at once
- **WHEN** another worktree's preview server is listening on the port an earlier run used
- **THEN** this run's end-to-end tests use a different port and pass

#### Scenario: A chosen port
- **WHEN** `E2E_PORT=4329` is set
- **THEN** the preview server listens on 4329 and the tests use it

#### Scenario: A malformed port
- **WHEN** `E2E_PORT` is `abc`, empty, `80` or `70000`
- **THEN** the end-to-end tests refuse to start, with an error naming `E2E_PORT`, the value and the valid range

### Requirement: The check builds the site against a fixture troupe with releases
The check SHALL build the site a second time against a troupe repository generated for the run, with release tags,
removed and added pages, and commits after the last tag, so that `/docs/next/`, archived versions, the version menu and
the per-version sidebars are tested before troupe has a release. The repository SHALL be made in a fresh temporary
folder, SHALL have no remote, and SHALL be deleted after the build. Its output SHALL never be published.

#### Scenario: Before troupe's first release
- **WHEN** the check runs while troupe-run/troupe has no tags
- **THEN** the fixture build has `/docs/`, `/docs/next/` and an archived version, and the version tests run against it

#### Scenario: Nothing is left behind
- **WHEN** the fixture build finishes, passing or failing
- **THEN** its temporary repository is gone, and no tag was created in any repository but that one

#### Scenario: A broken version feature
- **WHEN** a change makes the version menu link an archived page to the wrong version
- **THEN** the end-to-end tests of the fixture build fail, naming the page and the link

### Requirement: The fixture build reads fixture milestones
The fixture build SHALL read the release milestones from a fixture file kept in this repository, never from
troupe-run/infrastructure, so that the roadmap on `/status/` is tested against releases that don't change. The file
SHALL be put where the build reads it for the run only, and removed afterwards.

#### Scenario: The roadmap with releases
- **WHEN** the fixture build runs, with its troupe tagged `troupe-v0.1.0`, `troupe-v0.1.1` and `troupe-v0.2.0`
- **THEN** its `/status/` lists 0.1.0 and 0.2.0 under "Releases", with their tags' dates, and 0.3.0, 0.10.0 and
  1.0.0 under "Milestones", in that order and with no date, whatever troupe-run/infrastructure declares

#### Scenario: Nothing is left behind
- **WHEN** the fixture build finishes, passing or failing
- **THEN** the folder that held the fixture milestones is gone

### Requirement: The fixture troupe has protocol releases
The fixture troupe SHALL also hold `protocol/schemas/`, with `protocol-v*` tags of more than one major version and a
schema changed on `main` after the last tag, so that every `/protocol/` copy, the id rewrite and the reference check
are tested before troupe has a protocol release. Its tags SHALL be made only in the fixture's temporary repository.

#### Scenario: Before troupe's first protocol release
- **WHEN** the check runs while troupe-run/troupe has no `protocol-v*` tag
- **THEN** the fixture build has `/protocol/`, `/protocol/next/`, a copy for each major version and one for each tag,
  and the protocol tests run against it

#### Scenario: A broken id rewrite
- **WHEN** a change makes a major-version copy keep troupe's unversioned `$id`s
- **THEN** the tests of the fixture build fail, naming the file and the id
