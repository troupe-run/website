# Proposal

## Why

troupe-run/infrastructure#246 (change `review-resolves-fixed-nits`) lets Claude's review resolve a nit it opened once
a push has fixed it. The org's contributing guide, infrastructure's docs and the guard's session-start summary say so.
This repository's own `CLAUDE.md` step 5 and `openspec/config.yaml` context still say only that the review resolves its
must-fixes, so a session reading them resolves a fixed nit by hand when it needn't (website#89). The development-workflow
requirement "Review findings are acted on before a change is archived" now asks each governed repository's context to
say it too.

## What Changes

- `CLAUDE.md` step 5 says the review also resolves its own nits once a push has fixed them, so a nit fixed by a push
  needs no reply or resolve. It uses the words of infrastructure's `CLAUDE.md` step 5.
- `openspec/config.yaml`'s context, in its "Before archiving" bullet, says the review also resolves its own nits once a
  push has fixed them, so a nit fixed by a push needn't be resolved by hand. It uses the words of infrastructure's
  `openspec/config.yaml`.
- "Resolve only nits" stays in both: it's still the rule for the author.
- Nothing else in step 5 or the bullet changes. Infrastructure's step 5 says more than this (a must-fix fixed by a push
  gets no "fixed" reply; the review judges a reply when it's posted; the `claude review completed` check). Those came
  from other infrastructure changes and aren't what #89 asks for, so this change doesn't bring them in.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `contributing`: "The contributor docs describe the workflow" and "Every proposed change plans acting on Claude's
  review" say that the review resolves its own nits once a push has fixed them, as well as its must-fixes, and that
  the author still resolves only nits.

## Impact

- `CLAUDE.md` (step 5) and `openspec/config.yaml` (`context`). No site code, page, test or build changes.
- The guard's files aren't touched: they're delivered from infrastructure, which already says this.
