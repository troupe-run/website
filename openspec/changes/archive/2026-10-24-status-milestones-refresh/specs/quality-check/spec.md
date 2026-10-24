# Spec Delta

## MODIFIED Requirements

### Requirement: The check runs CI's gates in CI's order
`uv run scripts/check.py` SHALL run, in this order: its own tests, install dependencies from the lockfile, install
Playwright's Chromium, `astro check`, the unit tests, the build, the fixture build, the rebuild test, the brand-asset
verification, the internal link check of both builds, and the end-to-end tests of both builds. It SHALL need only uv,
Node, npm and git, and no Python package beyond the standard library.

#### Scenario: Every gate passes
- **WHEN** a contributor runs `uv run scripts/check.py` on a working tree where every gate passes
- **THEN** each gate runs once, in the order above, each is reported as passed with its time, and the command exits 0

#### Scenario: No Python packages to install
- **WHEN** `scripts/check.py` is run on a machine with uv, Node and npm and no project Python environment
- **THEN** it runs without installing any Python package

## ADDED Requirements

### Requirement: The check rebuilds the fixture site on an earlier build's cache
The check SHALL build the fixture site, then build it again on that build's cache with only the milestones changed,
and again with only troupe's release and protocol tags changed. After each rebuild it SHALL check that `/status/` and
`/protocol/` show the changed data. It SHALL fail if a rebuild didn't start from the earlier build's cache, since the
test would then prove nothing.

#### Scenario: A stale list
- **WHEN** a change lets a rebuild publish the list an earlier build rendered
- **THEN** the rebuild test fails, naming the page and the data it expected

#### Scenario: A rebuild that started from nothing
- **WHEN** a rebuild clears or ignores the earlier build's cache
- **THEN** the rebuild test fails, saying the rebuild didn't use the earlier build's cache

#### Scenario: Nothing is left behind
- **WHEN** the rebuild test finishes, passing or failing
- **THEN** its fixture repositories, milestones folders and output are gone, and `dist/` and `dist-fixture/` are as the
  builds before it left them
