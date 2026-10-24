## MODIFIED Requirements

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
