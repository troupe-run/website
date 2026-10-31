## MODIFIED Requirements

### Requirement: The contributor docs describe the workflow
CLAUDE.md SHALL describe the path every change follows: an issue, an OpenSpec change on a branch named exactly after
it, a draft pull request that closes the issue, Claude's review of the last push acted on, the pull request marked
ready once that review is clean, the change archived on the branch, and the owner's rebase merge through the merge
queue. CLAUDE.md SHALL NOT tell an agent to run a command that merges a pull request, queues it or turns on its
auto-merge. CLAUDE.md SHALL link the org's development-workflow guide, and README.md the org's contributing guide,
rather than restate them.

#### Scenario: An agent starts a session
- **WHEN** a coding agent reads CLAUDE.md
- **THEN** it finds the workflow's steps in order, the check to run before each commit, and that a refused action is
  followed by the refusal's fix, not a workaround

#### Scenario: An agent opens a pull request
- **WHEN** a coding agent reads CLAUDE.md's pull request step
- **THEN** it finds that the pull request is opened as a draft (`gh pr create --draft`), that Claude reviews a draft,
  and that CI's `test` waits until the pull request is marked ready

#### Scenario: An agent finishes a pull request
- **WHEN** a coding agent reads CLAUDE.md's step after the pull request
- **THEN** it finds that it waits for Claude's review of the last push, fixes or answers each finding, resolves only
  nits, raises decisions and disputed must-fixes with the owner, marks the pull request ready (`gh pr ready <n>`) once
  the review of the last push leaves no must-fix or decision open, and that a merge needs every conversation resolved,
  with the org's development-workflow guide linked for the tiers

#### Scenario: An agent merges a pull request
- **WHEN** a coding agent reads CLAUDE.md's merge step, with the change archived on the branch, `test` passed and
  every conversation resolved
- **THEN** it finds that it asks the owner to merge, and that the owner adds the pull request to the merge queue,
  which lands it by rebase once `test` and `guard (workflow rules)` pass on the queued commit
- **AND** it finds no merge command for it to run: `gh pr merge` and **Merge when ready** are named only as the
  owner's, and `gh pr merge <n> --rebase --admin`, which skips the queue, as the owner's route for emergencies

#### Scenario: A person looks for how work flows
- **WHEN** a contributor reads README.md
- **THEN** it links the org's contributing guide at `https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md`
  for the workflow, and doesn't restate the workflow's steps
