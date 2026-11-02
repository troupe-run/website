# Spec Delta

## MODIFIED Requirements

### Requirement: The contributor docs describe the workflow
CLAUDE.md SHALL describe the path every change follows: an issue, an OpenSpec change on a branch named exactly after
it, a draft pull request that closes the issue, Claude's review of the last push acted on, the pull request marked
ready once that review is clean, the change archived on the branch, and the owner's rebase merge through the merge
queue. CLAUDE.md SHALL link the org's development-workflow guide, and README.md the org's contributing guide, rather
than restate them.

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
- **AND** it finds that the review resolves its own must-fixes once they're addressed, and its own nits once a push has
  fixed them, so a nit fixed by a push needs no reply or resolve
- **AND** it finds that a must-fix fixed by a push gets no "fixed" reply, and that a reply needing a discussion goes
  before the push
- **AND** it finds that the review judges a reply to a must-fix when it's posted, and that the run is re-run
  (`gh run rerun <id>`) only if it fails
- **AND** it finds that the pull request is marked ready only once the review of the last push has completed: the
  required `claude review completed` check passed, or, if it failed, the run it names was re-run and passed

#### Scenario: An agent merges a pull request
- **WHEN** a coding agent reads CLAUDE.md's merge step, with the change archived on the branch, `test` passed and
  every conversation resolved
- **THEN** it finds that it asks the owner to merge, and that the owner adds the pull request to the merge queue,
  which lands it by rebase once `test`, `guard (workflow rules)` and `claude review completed` pass on the queued
  commit, the checks `main`'s ruleset requires
- **AND** it finds no merge command for it to run: `gh pr merge` and **Merge when ready** are named only as the
  owner's, and `gh pr merge <n> --rebase --admin`, which skips the queue, as the owner's route for emergencies

#### Scenario: A person looks for how work flows
- **WHEN** a contributor reads README.md
- **THEN** it links the org's contributing guide at `https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md`
  for the workflow, and doesn't restate the workflow's steps

### Requirement: Every proposed change plans acting on Claude's review
The `context` in `openspec/config.yaml` SHALL say that before archiving, the author waits for Claude's review of the
last push and acts on each finding by its tier: fixes or answers every must-fix and nit, resolves only nits, and
raises decisions and disputed must-fixes with the owner. It SHALL say that the review resolves its own must-fixes, and
its own nits once a push has fixed them, and SHALL name troupe-run/infrastructure's development-workflow guide as the
source of the tiers.

#### Scenario: A change is proposed
- **WHEN** an agent runs `/opsx:propose` in this repository and reads the context it's given
- **THEN** the context tells it to wait for Claude's review of the last push and act on each finding by its tier
  before archiving, so the change's tasks plan that step

#### Scenario: A nit is fixed by a push
- **WHEN** an agent reads the context's "Before archiving" bullet after pushing a fix for a nit
- **THEN** it finds that the review resolves that nit itself, so it needn't be resolved by hand, and that the author
  still resolves only nits

## ADDED Requirements

### Requirement: The context says how the review takes replies and readiness
The `context` in `openspec/config.yaml` SHALL say, in its "Before archiving" bullet, that the review judges a reply to
one of its must-fixes when it's posted, re-run only if that run fails; that a must-fix fixed by a push gets no "fixed"
reply, a reply needing a discussion going before the push; and that the pull request is marked ready only once the
review of the last push has completed (the required `claude review completed` check passed).

#### Scenario: A must-fix is answered without a push
- **WHEN** an agent reads the context's "Before archiving" bullet after replying to a must-fix without pushing
- **THEN** it finds that the review judges the reply when it's posted, and that it re-runs that run
  (`gh run rerun <id>`) only if it fails

#### Scenario: A must-fix is fixed by a push
- **WHEN** an agent reads the context's "Before archiving" bullet after pushing a fix for a must-fix
- **THEN** it finds that the fix gets no "fixed" reply, and that a reply needing a discussion would have gone before
  the push

#### Scenario: The pull request is marked ready
- **WHEN** an agent reads the context's "Before archiving" bullet before running `gh pr ready <n>`
- **THEN** it finds that it waits until the review of the last push has completed, with the required
  `claude review completed` check passed, or the run it names re-run if it failed
