# Spec Delta

## MODIFIED Requirements

### Requirement: The check runs CI's gates in CI's order
`uv run scripts/check.py` SHALL run, in this order: its own tests, install dependencies from the lockfile, install
Playwright's Chromium, `astro check`, the unit tests, the build, the fixture build, the brand-asset verification, the
internal link check of both builds, and the end-to-end tests of both builds. It SHALL need only uv, Node, npm and git,
and no Python package beyond the standard library.

#### Scenario: Every gate passes
- **WHEN** a contributor runs `uv run scripts/check.py` on a working tree where every gate passes
- **THEN** each gate runs once, in the order above, each is reported as passed with its time, and the command exits 0

#### Scenario: No Python packages to install
- **WHEN** `scripts/check.py` is run on a machine with uv, Node and npm and no project Python environment
- **THEN** it runs without installing any Python package

## ADDED Requirements

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
