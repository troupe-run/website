# Spec Delta

## ADDED Requirements

### Requirement: troupe's notice starts a deploy from main
The deploy SHALL also start when it's dispatched (`workflow_dispatch`), so that troupe-run/troupe can rebuild the site
when its docs change. A dispatched deploy SHALL take no inputs, SHALL build only `main`, and SHALL publish only through
the `github-pages` environment.

#### Scenario: A push to troupe's main
- **WHEN** troupe's release workflow dispatches the deploy on `main` after a push
- **THEN** the deploy builds this repository's `main` with troupe's current docs, and publishes it

#### Scenario: A dispatch on another ref
- **WHEN** the deploy is dispatched on a ref other than `main`
- **THEN** nothing is built or published

#### Scenario: The workflow takes no inputs
- **WHEN** `deploy.yml` is read
- **THEN** its `workflow_dispatch` trigger declares no inputs

### Requirement: troupe sends the notice after every push to its main
troupe-run/troupe's release workflow SHALL dispatch this repository's deploy after every push to troupe's `main`. It
SHALL do so after release-please has finished, so a tag created in that run is there for the build, in a job that holds
the `docs` environment, checks out nothing and uses only the `troupe-run-docs` App's token.

#### Scenario: A release
- **WHEN** a release pull request merges in troupe and release-please creates `troupe-v0.2.0`
- **THEN** the dispatched deploy publishes `troupe-v0.2.0` at `/docs/`

#### Scenario: release-please fails
- **WHEN** release-please fails on a push to troupe's `main`
- **THEN** the notice is still sent, and the site shows `main`'s docs

### Requirement: A deploy checks internal links before it publishes
Every deploy SHALL run the internal link check on the site it built, and SHALL NOT publish when a link is broken. The
site that was live before SHALL stay live.

#### Scenario: troupe adds a broken link
- **WHEN** a dispatched deploy builds a page whose link leads nowhere on the site
- **THEN** the deploy fails at the link check, names the link, and publishes nothing

### Requirement: Builds that are superseded are cancelled
Each deploy SHALL build the current `main` and the current troupe docs, so when a newer deploy starts, a build that is
still running SHALL be cancelled. A deploy that's already publishing SHALL NOT be cancelled.

#### Scenario: Two notices in quick succession
- **WHEN** troupe dispatches the deploy twice within a minute
- **THEN** the first build is cancelled if it hasn't finished, and the second one publishes

### Requirement: The deploy never builds the fixture
The deploy SHALL build only from troupe-run/troupe. It SHALL NOT run the fixture build or set `TROUPE_DOCS`.

#### Scenario: Reading the deploy
- **WHEN** `deploy.yml` is read
- **THEN** it doesn't mention `build:fixture` or `TROUPE_DOCS`, and a unit test fails if it does
