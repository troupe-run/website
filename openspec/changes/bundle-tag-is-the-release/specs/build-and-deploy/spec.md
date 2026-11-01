## MODIFIED Requirements

### Requirement: troupe sends the notice after every push to its main
troupe-run/troupe's release workflow SHALL dispatch this repository's deploy after every push to troupe's `main`. It
SHALL do so after release-please has finished, so a tag created in that run is there for the build, in a job that holds
the `docs` environment, checks out nothing and uses only the `troupe-run-docs` App's token.

#### Scenario: A release
- **WHEN** the pull request that pins the bundle merges in troupe and release-please creates `troupe-run-v0.2.0`
- **THEN** the dispatched deploy publishes `troupe-run-v0.2.0` at `/docs/`

#### Scenario: A component release before its bundle
- **WHEN** a release pull request merges in troupe and release-please creates `troupe-v0.3.0`, and no bundle tag yet
- **THEN** the dispatched deploy publishes the same release at `/docs/` as before, and `main`'s docs at `/docs/next/`

#### Scenario: release-please fails
- **WHEN** release-please fails on a push to troupe's `main`
- **THEN** the notice is still sent, and the site shows `main`'s docs
