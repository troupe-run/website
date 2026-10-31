## MODIFIED Requirements

### Requirement: Only CI on a push to main starts a deploy
Of CI's runs, only one that passed on a push to `main` SHALL start a deploy, and the deploy SHALL build the commit that
run is for. A run whose `test` job was skipped because the merge queue passed that commit counts as passed. A CI run on
a pull request or on a merge-queue commit SHALL NOT build or publish anything, whether it passes or fails.

#### Scenario: The merge queue tests a commit
- **WHEN** CI passes on a commit the merge queue created
- **THEN** no deploy builds or publishes, and the deploy runs once the queue has landed that commit on `main` and CI
  has passed on the push

#### Scenario: The push run skips the check the queue already ran
- **WHEN** the merge queue lands a commit it passed, and CI's run on the push to `main` skips `test` for that reason
- **THEN** that run concludes success, and the deploy builds and publishes that commit

#### Scenario: A pull request passes CI
- **WHEN** CI passes on a pull request
- **THEN** no deploy builds or publishes

#### Scenario: CI fails on main
- **WHEN** CI fails on a push to `main`
- **THEN** no deploy builds or publishes, and the site that was live before stays live
