## MODIFIED Requirements

### Requirement: Every proposed change plans acting on Claude's review
The `context` in `openspec/config.yaml` SHALL say that before archiving, the author waits for Claude's review of the
last push and acts on each finding by its tier: fixes or answers every must-fix and nit, resolves only nits, and
raises decisions and disputed must-fixes with the owner. It SHALL say that the review resolves its own must-fixes, and
its own nits once a push has fixed them, and SHALL name troupe-run/infrastructure's development-workflow guide as the
source of the tiers.

#### Scenario: A change is proposed
- **WHEN** an agent runs `/openspec-propose` in this repository and reads the context it's given
- **THEN** the context tells it to wait for Claude's review of the last push and act on each finding by its tier
  before archiving, so the change's tasks plan that step

#### Scenario: A nit is fixed by a push
- **WHEN** an agent reads the context's "Before archiving" bullet after pushing a fix for a nit
- **THEN** it finds that the review resolves that nit itself, so it needn't be resolved by hand, and that the author
  still resolves only nits
