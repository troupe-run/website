# build-and-deploy Specification

## Purpose

How troupe.run is built and published to GitHub Pages, and what the production build must share with the CI run
that gated it, so that what ships is what was tested.

## Requirements

### Requirement: One Node version, from .nvmrc

The site's Node version SHALL be written in one place, `.nvmrc`. CI, the deploy and every other workflow that runs
Node MUST take the version from `.nvmrc` and MUST NOT name a Node version of their own.

#### Scenario: The deploy builds with the version in .nvmrc
- **WHEN** a commit on main whose `.nvmrc` holds a version passes CI and the deploy runs
- **THEN** the deploy sets up that same Node version for the production build, as CI did for its run

#### Scenario: Changing .nvmrc changes every workflow
- **WHEN** `.nvmrc` is changed to a different version and nothing else is
- **THEN** CI, the deploy and the weekly link check all use the new version, with no workflow file edited

#### Scenario: A workflow that names its own Node version fails the checks
- **WHEN** a pull request adds a literal Node version to any workflow (for example `node-version: 22`)
- **THEN** CI's unit tests fail and name the workflow and step

### Requirement: The Node version written for people agrees with .nvmrc

Two places repeat the Node version for people rather than workflows: the lowest version `engines.node` in
`package.json` admits, and the version `README.md`'s set-up steps name. Each MUST have the same major version as
`.nvmrc`. CI's unit tests MUST fail when either doesn't, naming the file, what it says and what `.nvmrc` holds.

#### Scenario: .nvmrc moves and engines.node doesn't
- **WHEN** `.nvmrc` is changed from `26` to `28` and `engines.node` still says `>=26.0.0`
- **THEN** CI's unit tests fail, naming `package.json`, `>=26.0.0` and `28`

#### Scenario: .nvmrc moves and README.md doesn't
- **WHEN** `.nvmrc` is changed from `26` to `28` and `README.md` still says "Node 26 or later"
- **THEN** CI's unit tests fail, naming `README.md`, `26` and `28`

#### Scenario: README.md names no Node version
- **WHEN** `README.md`'s set-up steps no longer say "Node <version> or later"
- **THEN** CI's unit tests fail, saying `README.md` names no Node version, rather than passing

#### Scenario: All three agree
- **WHEN** `.nvmrc` holds `26`, `engines.node` is `>=26.0.0` and `README.md` says "Node 26 or later"
- **THEN** the test passes

### Requirement: A .nvmrc the deploy can't read stops the deploy

When `.nvmrc` is missing, empty, or holds anything other than one version value, the deploy MUST fail before
building, with a message that names `.nvmrc`, what it found and what a valid file looks like. It MUST NOT fall back
to a default Node version.

#### Scenario: Empty .nvmrc
- **WHEN** the deploy runs and `.nvmrc` is empty or only whitespace
- **THEN** the deploy fails before the build, saying `.nvmrc` holds no version, and nothing is published

#### Scenario: More than one value in .nvmrc
- **WHEN** the deploy runs and `.nvmrc` holds more than one value (two lines, or a value and a comment)
- **THEN** the deploy fails before the build, quoting what it found, and nothing is published

#### Scenario: Missing .nvmrc
- **WHEN** the deploy runs and `.nvmrc` does not exist
- **THEN** the deploy fails before the build, saying `.nvmrc` is missing, and nothing is published

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

### Requirement: A deploy checks internal links before it publishes
Every deploy SHALL run the internal link check on the site it built, and SHALL NOT publish when a link is broken or a
reference in a published protocol schema doesn't resolve (spec: protocol-schemas). The site that was live before SHALL
stay live.

#### Scenario: troupe adds a broken link
- **WHEN** a dispatched deploy builds a page whose link leads nowhere on the site
- **THEN** the deploy fails at the link check, names the link, and publishes nothing

#### Scenario: troupe removes a definition a schema still refers to
- **WHEN** a dispatched deploy builds a schema whose `$ref` names a `$defs` entry its target no longer has
- **THEN** the deploy fails at the link check, names the schema and the reference, and publishes nothing

### Requirement: Builds that are superseded are cancelled
Each deploy SHALL build the current `main` and the current troupe docs, so when a newer deploy starts, a build that is
still running SHALL be cancelled. A deploy that's already publishing SHALL NOT be cancelled.

#### Scenario: Two notices in quick succession
- **WHEN** the deploy is dispatched twice within a minute, by troupe, by infrastructure or one by each
- **THEN** the first build is cancelled if it hasn't finished, and the second one publishes

### Requirement: The deploy never builds the fixture
The deploy SHALL build only from troupe-run/troupe. It SHALL NOT run the fixture build or set `TROUPE_DOCS`.

#### Scenario: Reading the deploy
- **WHEN** `deploy.yml` is read
- **THEN** it doesn't mention `build:fixture` or `TROUPE_DOCS`, and a unit test fails if it does

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
