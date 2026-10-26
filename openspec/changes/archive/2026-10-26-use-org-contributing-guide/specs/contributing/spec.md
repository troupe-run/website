# Spec Delta

## MODIFIED Requirements

### Requirement: The contributor docs name the tools to install
README.md SHALL say to install uv and Node (at the version in `.nvmrc` or later), and that `uv run scripts/check.py`
is the check that runs before every commit and in CI. It SHALL also say how to run the site locally: the dev server,
the sync from troupe-run/troupe and its `TROUPE_DOCS` override, the fixture build, the test suites and their ports,
and brand assets.

#### Scenario: A new contributor sets up
- **WHEN** a contributor follows README.md's set-up steps on a machine with neither uv nor the repository's
  dependencies
- **THEN** `uv run scripts/check.py` runs to completion

#### Scenario: A contributor previews unpushed troupe docs
- **WHEN** a contributor reads README.md's notes on running the site locally
- **THEN** they find that `/docs` is fetched from troupe-run/troupe on every build, that an edit under
  `src/content/docs/docs/` is lost, and that `TROUPE_DOCS` points the build at their own troupe checkout

### Requirement: The contributor docs describe the workflow
CLAUDE.md SHALL describe the path every change follows: an issue, an OpenSpec change on a branch named exactly after
the change, a pull request that closes the issue, the change archived on the branch, and a rebase merge. CLAUDE.md
SHALL link the org's development-workflow guide rather than restate its rules, and README.md SHALL link the org's
contributing guide for the workflow rather than restate it.

#### Scenario: An agent starts a session
- **WHEN** a coding agent reads CLAUDE.md
- **THEN** it finds the workflow's steps in order, the check to run before each commit, and that a refused action is
  followed by the refusal's fix, not a workaround

#### Scenario: A person looks for how work flows
- **WHEN** a contributor reads README.md
- **THEN** it links the org's contributing guide at `https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md`
  for the workflow, and doesn't restate the workflow's steps

### Requirement: Commits are Conventional and need no sign-off
CLAUDE.md SHALL say that commit messages are Conventional Commits and that this repository asks for no DCO sign-off
and no CLA. Neither CLAUDE.md nor README.md SHALL tell contributors to sign off commits.

#### Scenario: A contributor reads the commit rules
- **WHEN** a contributor reads CLAUDE.md
- **THEN** it says commits are Conventional, and says no sign-off is needed

#### Scenario: Nothing here asks for a sign-off
- **WHEN** a contributor reads README.md or CLAUDE.md
- **THEN** neither tells them to run `git commit -s` or add a `Signed-off-by:` line

### Requirement: Contributions keep the repository's licences
README.md SHALL name MIT for code and CC BY 4.0 for content, and say that the troupe name, mark and characters are
trademarks licensed under neither. It SHALL link the org's contributing guide for the terms contributions come in on.

#### Scenario: A contributor checks the terms
- **WHEN** a contributor reads README.md's licence section
- **THEN** it names both licences and the trademark exception, and links the org's contributing guide, with no
  separate agreement to sign

### Requirement: An outside fix is carried by a maintainer
README.md SHALL tell an outside contributor that their **Improve this page** pull request will fail the `guard` check
and that this is expected, and SHALL link the org's contributing guide's "A fix from outside" section for what happens
to their fix next.

#### Scenario: A fork pull request's guard check fails
- **WHEN** an outside contributor opens a pull request from GitHub's web editor and sees the `guard` check fail
- **THEN** README.md tells them that's expected and links the org guide's section on what happens to their fix next

## ADDED Requirements

### Requirement: The repository has no contributing guide of its own
The repository SHALL hold no `CONTRIBUTING.md` (at its root, in `.github/` or in `docs/`), so GitHub shows the org's
guide from troupe-run/.github for it. No committed file outside the historical records (`docs/superpowers/` and
OpenSpec changes) and the test that checks this SHALL link to a `CONTRIBUTING.md` other than the org guide's URL.

#### Scenario: GitHub shows the org's guide
- **WHEN** a contributor opens the repository's contributing link on GitHub
- **THEN** it shows troupe-run/.github's `CONTRIBUTING.md`, because the repository has none of its own

#### Scenario: A guide of its own comes back
- **WHEN** a commit adds `CONTRIBUTING.md` at the root, in `.github/` or in `docs/`, or a file links to
  `CONTRIBUTING.md` by a relative path
- **THEN** `uv run scripts/check.py` fails and names the file
