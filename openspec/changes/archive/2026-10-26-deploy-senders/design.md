# Design

## Context

`build-and-deploy` has one requirement for what the deploy accepts ("troupe's notice starts a deploy from main") and
one for what a sender does ("troupe sends the notice after every push to its main"). infrastructure's
`milestones-notice` workflow (troupe-run/infrastructure#137) is the second sender. Its own `milestones` spec,
"A change to the milestones rebuilds troupe.run", already states its trigger and limits, and its
`scripts/tests/test_milestones_notice_workflow.py` checks them. The deploy needed no change to accept it: any
`workflow_dispatch` on `main` with no inputs builds and publishes.

## Goals / Non-Goals

**Goals:**

- A reader of the spec, or of `deploy.yml`, finds both senders and what each sends.

**Non-Goals:**

- Telling the senders apart in the deploy. A dispatched run doesn't record who sent it beyond the actor, and nothing
  in the build depends on it.
- Any change in troupe or infrastructure.

## Decisions

### D1. Rename the dispatch requirement rather than add a second one

The requirement's text is about the deploy (no inputs, only `main`, only `github-pages`), which holds for every
sender. Its name says "troupe's". Renaming it to "A notice from troupe or infrastructure starts a deploy from main"
keeps one requirement for what the deploy accepts, with one scenario per sender.

Alternative: a second "infrastructure's notice starts a deploy from main" requirement. It would repeat the same three
SHALLs, and the two copies could drift.

### D2. infrastructure's sending side gets its own requirement here, mirroring troupe's

The issue asks for it, and it matches the existing pair: troupe's sending side is specified here though its code is in
troupe. The new requirement says the same as infrastructure's `milestones` spec, from this repository's side, so the
two must agree. If infrastructure's trigger changes, both specs change.

Alternative: one scenario that cites infrastructure's spec. Shorter, but it leaves the "what is sent and when" answer
in another repository, which is the gap #47 is about.

### D3. No new test here

Nothing this repository runs changes. The deploy's side ("no inputs, only `main`") is already covered by
`tests/unit/deploy-workflow.test.ts`. The new requirement describes a workflow in infrastructure, which this
repository can't run or read at test time; it's held by infrastructure's
`scripts/tests/test_milestones_notice_workflow.py`, as troupe's sending side is held by troupe. The task that edits
the requirement checks it against infrastructure's workflow and spec by reading them, and names them.

### D4. "the current troupe docs" stays in the cancellation requirement

"Builds that are superseded are cancelled" says each deploy builds the current `main` and the current troupe docs.
Every build also reads infrastructure's current milestones, but the requirement only explains why a newer build makes
an older one redundant, and that holds as written. Only its scenario changes, to cover either sender.

## Risks / Trade-offs

- [The new requirement and infrastructure's `milestones` spec drift apart] → Both cite each other (`deploy.yml`'s
  header and the new requirement name infrastructure's workflow; infrastructure's workflow header names this spec), so
  a change on one side points at the other.
