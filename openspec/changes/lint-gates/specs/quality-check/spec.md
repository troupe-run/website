## MODIFIED Requirements

### Requirement: The check runs CI's gates in CI's order
`uv run scripts/check.py` SHALL run, in this order: its own tests, install dependencies from the lockfile, ESLint,
Prettier's format check, install Playwright's Chromium, `astro check`, `tsc --noEmit`, the unit tests, the build, the
fixture build, the rebuild test, the brand-asset verification, the internal link check of both builds, and the
end-to-end tests of both builds. It SHALL need only uv, Node, npm and git, and no Python package beyond the standard
library.

#### Scenario: Every gate passes
- **WHEN** a contributor runs `uv run scripts/check.py` on a working tree where every gate passes
- **THEN** each gate runs once, in the order above, each is reported as passed with its time, and the command exits 0

#### Scenario: No Python packages to install
- **WHEN** `scripts/check.py` is run on a machine with uv, Node and npm and no project Python environment
- **THEN** it runs without installing any Python package

## ADDED Requirements

### Requirement: The check lints and formats the code
The check SHALL fail when ESLint reports an error, when a file in Prettier's scope isn't formatted as Prettier would
format it, or when `tsc --noEmit` reports a type error. Each tool's rules SHALL be declared in one config file in this
repository, and a rule turned off, or a file left out, SHALL carry its reason there.

#### Scenario: A lint error
- **WHEN** a change adds an unused variable to a file under `src/`
- **THEN** the check fails at the `eslint` gate, naming the file, the line and the rule

#### Scenario: An unformatted file
- **WHEN** a change adds a `.ts` file with double-quoted strings
- **THEN** the check fails at the `prettier` gate, naming the file

#### Scenario: A type error outside Astro's files
- **WHEN** a change makes a `.ts` file assign a string to a number
- **THEN** the check fails at the `tsc` gate, naming the file and the error

#### Scenario: Prose isn't reformatted
- **WHEN** Prettier's check runs
- **THEN** it reads no Markdown or MDX file, and no generated or delivered file
