## MODIFIED Requirements

### Requirement: The check builds the site against a fixture troupe with releases
The check SHALL build the site a second time against a troupe repository generated for the run, with release tags,
removed and added pages, and commits after the last tag, so that `/docs/next/`, archived versions, the version menu and
the per-version sidebars are tested before troupe has a release. The repository SHALL be made in a fresh temporary
folder, SHALL have no remote, and SHALL be deleted after the build. Its output SHALL never be published.

#### Scenario: Before troupe's first release
- **WHEN** the check runs while troupe-run/troupe has no tags
- **THEN** the fixture build has `/docs/`, `/docs/next/` and an archived version, and the version tests run against it

#### Scenario: Nothing is left behind
- **WHEN** the fixture build finishes, passing or failing
- **THEN** its temporary repository is gone, and no tag was created in any repository but that one

#### Scenario: A broken version feature
- **WHEN** a change makes the version menu link an archived page to the wrong version
- **THEN** the end-to-end tests of the fixture build fail, naming the page and the link

#### Scenario: Releases are the bundle's tags
- **WHEN** the fixture troupe is made
- **THEN** its releases are tagged `troupe-run-v*`, and it also has core `troupe-v*` tags whose versions and commits
  disagree with the bundle's, so that a build that read core's tag as the release would publish different versions
  and fail the version tests

### Requirement: The fixture build reads fixture milestones
The fixture build SHALL read the release milestones from a fixture file kept in this repository, never from
troupe-run/infrastructure, so that the roadmap on `/status/` is tested against releases that don't change. The file
SHALL be put where the build reads it for the run only, and removed afterwards.

#### Scenario: The roadmap with releases
- **WHEN** the fixture build runs, with its troupe tagged `troupe-run-v0.1.0`, `troupe-run-v0.1.1` and
  `troupe-run-v0.2.0`, and with core tagged `troupe-v0.1.0` and `troupe-v0.3.0`
- **THEN** its `/status/` lists 0.1.0 and 0.2.0 under "Releases", with their bundle tags' dates, and 0.3.0, 0.10.0
  and 1.0.0 under "Milestones", in that order and with no date, whatever troupe-run/infrastructure declares

#### Scenario: Nothing is left behind
- **WHEN** the fixture build finishes, passing or failing
- **THEN** the folder that held the fixture milestones is gone
