## MODIFIED Requirements

### Requirement: The contributor docs describe the workflow
CLAUDE.md SHALL describe the path every change follows: an issue, an OpenSpec change on a branch named exactly after
the change, a pull request that closes the issue, Claude's review of the last push acted on, the change archived on
the branch, and a rebase merge through the merge queue. CLAUDE.md SHALL link the org's development-workflow guide
rather than restate its rules, and README.md SHALL link the org's contributing guide for the workflow rather than
restate it.

#### Scenario: An agent starts a session
- **WHEN** a coding agent reads CLAUDE.md
- **THEN** it finds the workflow's steps in order, the check to run before each commit, and that a refused action is
  followed by the refusal's fix, not a workaround

#### Scenario: An agent finishes a pull request
- **WHEN** a coding agent reads CLAUDE.md's step after the pull request
- **THEN** it finds that it waits for Claude's review of the last push, fixes or answers each finding, resolves only
  nits, raises decisions and disputed must-fixes with the owner, and that a merge needs every conversation resolved,
  with the org's development-workflow guide linked for the tiers

#### Scenario: An agent merges a pull request
- **WHEN** a coding agent reads CLAUDE.md's merge step
- **THEN** it finds that the pull request is added to the merge queue (`gh pr merge <n>`, or **Merge when ready**),
  which lands it by rebase once `test` and `guard (workflow rules)` pass on the queued commit, and that
  `gh pr merge <n> --rebase --admin` skips the queue and is for emergencies only

#### Scenario: A person looks for how work flows
- **WHEN** a contributor reads README.md
- **THEN** it links the org's contributing guide at `https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md`
  for the workflow, and doesn't restate the workflow's steps

## ADDED Requirements

### Requirement: Every proposed change plans acting on Claude's review
The `context` in `openspec/config.yaml` SHALL say that before archiving, the author waits for Claude's review of the
last push and acts on each finding by its tier: fixes or answers every must-fix and nit, resolves only nits, and
raises decisions and disputed must-fixes with the owner. It SHALL name troupe-run/infrastructure's
development-workflow guide as the source of the tiers.

#### Scenario: A change is proposed
- **WHEN** an agent runs `/opsx:propose` in this repository and reads the context it's given
- **THEN** the context tells it to wait for Claude's review of the last push and act on each finding by its tier
  before archiving, so the change's tasks plan that step
