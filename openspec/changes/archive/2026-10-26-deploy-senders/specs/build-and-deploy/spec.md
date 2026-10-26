# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: troupe's notice starts a deploy from main`
- TO: `### Requirement: A notice from troupe or infrastructure starts a deploy from main`

## MODIFIED Requirements

### Requirement: A notice from troupe or infrastructure starts a deploy from main
The deploy SHALL also start when it's dispatched (`workflow_dispatch`), so that troupe-run/troupe can rebuild the site
when its docs change, and troupe-run/infrastructure can rebuild it when its release milestones change. A dispatched
deploy SHALL take no inputs, SHALL build only `main`, and SHALL publish only through the `github-pages` environment,
whichever of them sent it.

#### Scenario: A push to troupe's main
- **WHEN** troupe's release workflow dispatches the deploy on `main` after a push
- **THEN** the deploy builds this repository's `main` with troupe's current docs, and publishes it

#### Scenario: A change to infrastructure's milestones
- **WHEN** infrastructure's milestones notice dispatches the deploy on `main` after a push that changes
  `tofu/milestones.json`
- **THEN** the deploy builds this repository's `main` with infrastructure's current milestones, and publishes it

#### Scenario: A dispatch on another ref
- **WHEN** the deploy is dispatched on a ref other than `main`
- **THEN** nothing is built or published

#### Scenario: The workflow takes no inputs
- **WHEN** `deploy.yml` is read
- **THEN** its `workflow_dispatch` trigger declares no inputs

### Requirement: Builds that are superseded are cancelled
Each deploy SHALL build the current `main` and the current troupe docs, so when a newer deploy starts, a build that is
still running SHALL be cancelled. A deploy that's already publishing SHALL NOT be cancelled.

#### Scenario: Two notices in quick succession
- **WHEN** the deploy is dispatched twice within a minute, by troupe, by infrastructure or one by each
- **THEN** the first build is cancelled if it hasn't finished, and the second one publishes

## ADDED Requirements

### Requirement: infrastructure sends the notice when its milestones change on main
troupe-run/infrastructure's milestones notice SHALL dispatch this repository's deploy after every push to
infrastructure's `main` that changes `tofu/milestones.json`, so `/status/` shows the new release list. It SHALL do so
in a job that holds the `docs` environment, checks out nothing and uses only the `troupe-run-docs` App's token.

#### Scenario: A milestone is re-described
- **WHEN** a pull request that changes a description in `tofu/milestones.json` merges to infrastructure's `main`
- **THEN** a Deploy run starts here on `main`, triggered by `workflow_dispatch`, and `/status/` shows the new
  description once it publishes

#### Scenario: A push that doesn't touch the milestones
- **WHEN** a push to infrastructure's `main` changes other files only, such as the state commit after an apply
- **THEN** no Deploy run is dispatched
