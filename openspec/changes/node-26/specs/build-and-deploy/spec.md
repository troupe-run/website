# Spec Delta

## ADDED Requirements

### Requirement: The Node version written for people agrees with .nvmrc

Two places repeat the Node version for people rather than workflows: the lowest version `engines.node` in
`package.json` admits, and the version `CONTRIBUTING.md`'s set-up steps name. Each MUST have the same major version as
`.nvmrc`. CI's unit tests MUST fail when either doesn't, naming the file, what it says and what `.nvmrc` holds.

#### Scenario: .nvmrc moves and engines.node doesn't
- **WHEN** `.nvmrc` is changed from `26` to `28` and `engines.node` still says `>=26.0.0`
- **THEN** CI's unit tests fail, naming `package.json`, `>=26.0.0` and `28`

#### Scenario: .nvmrc moves and CONTRIBUTING.md doesn't
- **WHEN** `.nvmrc` is changed from `26` to `28` and `CONTRIBUTING.md` still says "Node 26 or later"
- **THEN** CI's unit tests fail, naming `CONTRIBUTING.md`, `26` and `28`

#### Scenario: CONTRIBUTING.md names no Node version
- **WHEN** `CONTRIBUTING.md`'s set-up steps no longer say "Node <version> or later"
- **THEN** CI's unit tests fail, saying `CONTRIBUTING.md` names no Node version, rather than passing

#### Scenario: All three agree
- **WHEN** `.nvmrc` holds `26`, `engines.node` is `>=26.0.0` and `CONTRIBUTING.md` says "Node 26 or later"
- **THEN** the test passes
