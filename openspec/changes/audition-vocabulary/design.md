# Design

## Context

The brand guide's §6 table has two columns, Term and Status. Meanings live only in troupe's glossary (spec:
vocabulary). `tests/unit/vocabulary.test.ts` reads the glossary as `npm run docs:sync` fetched it from troupe's
`main`, and fails while the guide keeps a term the glossary has no row for. troupe's glossary has no "audition" row
today, and troupe#233's outcome doesn't add one. For the motivation, see proposal.md, "Why".

## Goals / Non-Goals

**Goals:**

- Give audition a status that can't be read as "working today", and that can't be mistaken for rehearsal.

**Non-Goals:**

- The term's meaning. That's troupe's glossary row, written in troupe.
- Rehearsal's own status. See Open Questions.
- Docs pages and landing copy that use the word. Those are written in troupe, under #233 and #234.

## Decisions

**D1. The status text.** The row reads:

| Term | Status |
|---|---|
| audition | In use, 2026-11-01: troupe init --audition, from 0.2.0, writes a working example actor. Not a rehearsal, which is a dry run (--rehearse) |

- "In use", as the issue says, rather than "Reserved" until 0.2.0 ships and then a second edit. The owner chose this
  (2026-11-02): a later status change would be busy work. "From 0.2.0" keeps the row accurate before then, so it
  doesn't describe unbuilt behaviour as working.
- The date is that of the decision (troupe#232, 2026-11-01), as the other rows date theirs.
- The table only holds a status, so the "not a rehearsal" note goes in the status rather than in a new column. The
  check fails on a third column.
- Plain text, no code font, as every other status cell in the table is written.
- The row goes straight after rehearsal, so the two are read together.

**D2. Landing order.** troupe's glossary row lands first (troupe-run/troupe#257), and the guide row is committed
here once it's on `main`. The plan was to land both together, with this pull request's `test` red in between (owner,
2026-11-02). That turned out not to work: the guard runs the check before every commit and refused the guide row
while the glossary lacked it. The owner then chose to do #257 first, in its own session, over an override or
folding the row into #233.

**D3. One named test.** The general check already fails when a kept term has no glossary row. One new test checks
what's specific to audition: its guide status starts "In use", carries the decision's date, names
`troupe init --audition` and 0.2.0, and says it isn't a rehearsal. The glossary has the row as well.

## Risks / Trade-offs

- [This change waits on troupe] → The guide row and test stay staged on this branch until #257 is on `main`.
- [troupe's row and the guide row could disagree on what audition is] → The troupe issue quotes this status text, so
  the meaning it writes matches it.
- ["In use" before 0.2.0 has shipped] → The status names 0.2.0, so it says when the flag arrives, not that it
  works today. If #233 slips past 0.2.0, the row's release number changes with it.

## Open Questions

- **Rehearsal's status.** The guide still says "Reserved, 2026-10-19", but troupe's glossary describes `--rehearse` as
  something you run today. That may be stale. It's outside #85. Raised with the owner, who said to leave it for now
  (2026-11-02).
