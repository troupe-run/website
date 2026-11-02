# Proposal

## Why

troupe-run/infrastructure#246 (change `review-resolves-fixed-nits`) lets Claude's review resolve a nit it opened once
a push has fixed it. The org's contributing guide, infrastructure's docs and the guard's session-start summary say so.
This repository's own `CLAUDE.md` step 5 and `openspec/config.yaml` context still say only that the review resolves its
must-fixes, so a session reading them resolves a fixed nit by hand when it needn't (website#89). The development-workflow
requirement "Review findings are acted on before a change is archived" now asks each governed repository's context to
say it too.

Two earlier infrastructure changes left the same two files behind (website#101). Since troupe-run/infrastructure#208
(PR #215, `review-judge-reply-on-post`), a reply to one of the review's open must-fixes starts a review that judges it,
so re-running the review by hand is needed only when that run fails. Since troupe-run/infrastructure#242 (PR #243,
`review-completed-check`), `claude review completed` is a required check on `main`, beside `test` and
`guard (workflow rules)`, and a "fixed" reply to a must-fix a push fixed cancels the push's running review and leaves
that check failed. Until this lands, a session re-runs a review that already ran, and can leave the required check
failed by replying "fixed".

## What Changes

- `CLAUDE.md` step 5 says the review also resolves its own nits once a push has fixed them, so a nit fixed by a push
  needs no reply or resolve (#89).
- `CLAUDE.md` step 5 says, in the words of infrastructure's `CLAUDE.md` step 5 (#101):
  - a must-fix fixed by a push gets no "fixed" reply; reply only when it needs a discussion, and then before pushing;
  - the review judges a reply to a must-fix when it's posted; if that run fails, re-run it (`gh run rerun <id>`). This
    replaces "for a must-fix answered without a push, re-run the last `claude review` run";
  - mark the pull request ready only once the review of the last push has completed (the required
    `claude review completed` check passed; if it failed, re-run the run it names) and leaves no must-fix or decision
    open.
- `CLAUDE.md` step 6 names `claude review completed` beside `test` and `guard (workflow rules)` among the checks the
  merge queue waits for, matching `main`'s ruleset (#101).
- `openspec/config.yaml`'s context, in its "Before archiving" bullet, says all four: the review resolves its own nits
  once a push has fixed them, and judges a reply to a must-fix when it's posted (both in the words of infrastructure's
  `openspec/config.yaml`); a must-fix fixed by a push gets no "fixed" reply; and the pull request is marked ready only
  once the review of the last push has completed. Infrastructure's context says nothing of the last two, so they use
  the words of its `CLAUDE.md` (owner, 2026-11-02, as #101's "Done when" asks).
- "Resolve only nits" stays in both: it's still the rule for the author.
- Out of scope: infrastructure's step 5 also says CI posts its plan as evidence once the owner approves the run. That's
  about infrastructure's own CI and doesn't apply here.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `contributing`: "The contributor docs describe the workflow" and "Every proposed change plans acting on Claude's
  review" say that the review resolves its own nits once a push has fixed them as well as its must-fixes, that it
  judges a reply to a must-fix when it's posted, that a must-fix fixed by a push gets no "fixed" reply, that the pull
  request is marked ready only once the review of the last push has completed, and that the merge queue waits for
  `claude review completed` too. The author still resolves only nits.

## Impact

- `CLAUDE.md` (steps 5 and 6) and `openspec/config.yaml` (`context`). No site code, page, test or build changes.
- The guard's files aren't touched: they're delivered from infrastructure, which already says this.
