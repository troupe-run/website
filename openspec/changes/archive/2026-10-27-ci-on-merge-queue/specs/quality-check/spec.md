## MODIFIED Requirements

### Requirement: CI runs the same check
CI's `test` job SHALL run `uv run scripts/check.py` for every pull request, every push to `main` and every commit the
merge queue tests, and SHALL NOT run any of its gates as a separate step. The job SHALL keep the name `test`. On a
merge-queue commit it SHALL run every gate, as on a push to `main`.

#### Scenario: A pull request's CI
- **WHEN** a pull request is opened or updated
- **THEN** the `test` job's gate output comes from `scripts/check.py`, and the job fails exactly when the check fails

#### Scenario: A merge-queue commit's CI
- **WHEN** the merge queue creates a commit for a pull request on top of `main` and whatever is queued ahead of it
- **THEN** the `test` job runs `scripts/check.py` on that commit, every gate runs, and the job reports `test` on that
  commit, so the queue lands it only when the check passes

#### Scenario: A trigger is dropped
- **WHEN** a change removes the `pull_request`, the `push` to `main` or the `merge_group` trigger from CI, or renames
  the `test` job
- **THEN** CI's unit tests fail and name what's missing
