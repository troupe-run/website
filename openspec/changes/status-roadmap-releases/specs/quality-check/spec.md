# Spec Delta

## MODIFIED Requirements

### Requirement: The check builds the site against a fixture troupe with releases
The check SHALL build the site a second time against a troupe repository generated for the run, with release tags,
removed and added pages, and commits after the last tag, so that `/docs/next/`, archived versions, the version menu and
the per-version sidebars are tested before troupe has a release. The repository SHALL be made in a fresh temporary
folder, SHALL have no remote, and SHALL be deleted after the build. Its output SHALL never be published. The fixture
build SHALL also read a fixture milestones file kept in this repository, never troupe-run/infrastructure's, so that the
roadmap on `/status/` is tested against fixed releases.

#### Scenario: Before troupe's first release
- **WHEN** the check runs while troupe-run/troupe has no tags
- **THEN** the fixture build has `/docs/`, `/docs/next/` and an archived version, and the version tests run against it

#### Scenario: Nothing is left behind
- **WHEN** the fixture build finishes, passing or failing
- **THEN** its temporary repository is gone, and no tag was created in any repository but that one

#### Scenario: A broken version feature
- **WHEN** a change makes the version menu link an archived page to the wrong version
- **THEN** the end-to-end tests of the fixture build fail, naming the page and the link

#### Scenario: The roadmap with releases
- **WHEN** the fixture build runs, with its troupe tagged `troupe-v0.1.0`, `troupe-v0.1.1` and `troupe-v0.2.0`
- **THEN** its `/status/` lists the fixture milestones in version order, shows 0.1.0 and 0.2.0 as released and marks
  the next fixture milestone as being worked on, whatever troupe-run/infrastructure declares
