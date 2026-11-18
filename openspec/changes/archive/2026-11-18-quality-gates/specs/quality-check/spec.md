# Spec Delta

## MODIFIED Requirements

### Requirement: The check runs CI's gates in CI's order
`uv run scripts/check.py` SHALL run, in this order: its own tests, the complexity gate, install dependencies from the
lockfile, ESLint, Prettier's format check, install Playwright's Chromium, `astro check`, `tsc --noEmit`, the unit tests,
the dependency audit (on CI's audit leg only), the build, the fixture build, the rebuild test, the brand-asset
verification, the internal link check of both builds, and the end-to-end tests of both builds.

#### Scenario: Every gate passes
- **WHEN** a contributor runs `uv run scripts/check.py` on a working tree where every gate passes
- **THEN** each gate runs once, in the order above, each is reported as passed with its time, and the command exits 0

### Requirement: CI runs the same check
CI's `test` job SHALL run `uv run scripts/check.py --base <commit>`, every gate of it, with `QUALITY_GATES_LEG=true`
so the dependency audit runs there, for every pull request that's ready for review, every merge-queue commit, and every
push to `main` the merge queue didn't pass. It SHALL keep the name `test` and run no gate as a separate step. It SHALL
be skipped on a draft and on a push to `main` of a commit CI's merge-queue run passed, and CI's run SHALL still
conclude success.

#### Scenario: A pull request's CI
- **WHEN** a pull request that's ready for review is opened or updated
- **THEN** the `test` job's gate output comes from `scripts/check.py`, and the job fails exactly when the check fails

#### Scenario: A draft pull request
- **WHEN** a draft pull request is opened or updated
- **THEN** CI's `test` job is skipped, the run says the check runs once the pull request is marked ready, and the run
  concludes success

#### Scenario: A draft is marked ready
- **WHEN** a draft pull request is marked ready for review
- **THEN** CI runs, and its `test` job runs `scripts/check.py` on the pull request

#### Scenario: A merge-queue commit's CI
- **WHEN** the merge queue creates a commit for a pull request on top of `main` and whatever is queued ahead of it
- **THEN** the `test` job runs `scripts/check.py` on that commit, every gate runs, and the job reports `test` on that
  commit, so the queue lands it only when the check passes

#### Scenario: The merge queue lands a commit it passed
- **WHEN** a commit is pushed to `main` and CI's merge-queue run on that same commit succeeded
- **THEN** CI's `test` job is skipped, the run says the merge queue passed that commit, and the run concludes success

#### Scenario: A commit reaches main without the merge queue
- **WHEN** a commit is pushed to `main` and CI has no merge-queue run on it, as with the App's guard deliveries
- **THEN** the `test` job runs `scripts/check.py` on that commit and every gate runs

#### Scenario: The merge queue's run on the commit failed
- **WHEN** a commit is pushed to `main` and every CI merge-queue run on it concluded something other than success
- **THEN** the `test` job runs `scripts/check.py` on that commit and every gate runs

#### Scenario: The merge queue's run can't be read
- **WHEN** a commit is pushed to `main` and GitHub can't be asked about CI's merge-queue runs on it, answers in a shape
  that can't be read, or reports a run status that isn't known
- **THEN** the run warns, naming why, the `test` job runs every gate, and the lookup itself doesn't fail the run

#### Scenario: The merge queue's run is still closing
- **WHEN** a commit is pushed to `main` while CI's merge-queue run on it hasn't yet completed
- **THEN** CI waits for that run for up to two minutes, skips `test` if it succeeds in that time, and otherwise runs
  every gate with a warning

#### Scenario: A trigger is dropped
- **WHEN** a change removes the `pull_request` trigger or its `ready_for_review` type, the `push` to `main` or the
  `merge_group` trigger from CI, or renames the `test` job
- **THEN** CI's unit tests fail and name what's missing

### Requirement: The check refuses arguments it doesn't take
The check SHALL take one option, `--base <commit>`, which names what the complexity and audit gates judge the work
against. Any other argument, including `--scope`, SHALL be refused with a usage error and a non-zero exit, before any
gate runs, because this repository declares no scopes.

#### Scenario: An unexpected argument
- **WHEN** a contributor runs `uv run scripts/check.py --scope docs`
- **THEN** it exits non-zero with a usage error and runs no gate

#### Scenario: A base is named
- **WHEN** CI runs `uv run scripts/check.py --base <sha>`
- **THEN** the complexity gate judges the functions changed since that commit

## ADDED Requirements

### Requirement: The check needs uv, Node, npm and git, and one Python package of its own
`scripts/check.py` SHALL need only uv, Node, npm and git. Its one Python package, lizard, SHALL be the script's own
inline dependency, which uv installs for it; the check SHALL need no project Python environment.

#### Scenario: No project Python environment
- **WHEN** `scripts/check.py` is run on a machine with uv, Node and npm and no project Python environment
- **THEN** uv installs lizard for the script alone, and the check runs without any other Python package

### Requirement: The check runs the complexity gate everywhere
The check SHALL run the complexity gate (troupe-run/infrastructure spec: quality-gates) on every run, local and in CI,
over the site's TypeScript and JavaScript, with the thresholds in `quality-gates.toml`. Without `--base`, it SHALL judge
the work against where it left `origin/main`.

#### Scenario: A local commit adds a complex function
- **WHEN** the guard runs the check before a commit that adds a TypeScript function whose complexity is above the limit
- **THEN** the check fails at the complexity gate, naming the function, and the commit is refused

### Requirement: CI's test job audits the lock file, and nothing measures coverage
CI's `test` job SHALL run the dependency-audit gate over `package-lock.json`, by setting `QUALITY_GATES_LEG=true`. No
local run SHALL audit: the check SHALL fail, naming the variable, when it's set outside GitHub Actions or to anything
but `true`. website SHALL measure no coverage: only the repositories troupe-run/infrastructure names do (owner,
2026-11-18, troupe-run/infrastructure#332).

#### Scenario: The audit leg
- **WHEN** a ready pull request that changes `package-lock.json` runs CI
- **THEN** the `test` job audits it, and no step measures coverage

#### Scenario: The audit asked for locally
- **WHEN** someone runs `QUALITY_GATES_LEG=true uv run scripts/check.py` on their machine
- **THEN** the check stops before any gate, saying the audit runs in CI only and to unset the variable

### Requirement: Advisories no gate blocks on are reported weekly
website SHALL audit `package-lock.json` on `main` every week and keep one "Dependency advisories" issue up to date,
opened, updated and closed as troupe-run/infrastructure's quality-gates spec says, and SHALL put a newly opened one on
the troupe roadmap board.

#### Scenario: Advisories in the lock
- **WHEN** the weekly audit finds advisories in `package-lock.json` and no report issue is open
- **THEN** it opens one listing each of them, any severity, and the board job adds it to the board
