## MODIFIED Requirements

### Requirement: CI runs the same check
CI's `test` job SHALL run `uv run scripts/check.py` for every pull request that's ready for review, every commit the
merge queue tests, and every push to `main` the merge queue didn't pass, and SHALL NOT run any of its gates as a
separate step. The job SHALL keep the name `test`. On a merge-queue commit, and on a push to `main` that runs it, it
SHALL run every gate. It SHALL be skipped on a draft pull request and on a push to `main` of a commit whose CI
merge-queue run succeeded, and CI's run SHALL still conclude success.

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
