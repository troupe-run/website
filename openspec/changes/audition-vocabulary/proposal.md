# Proposal

## Why

The owner chose `--audition` as the name of `troupe init`'s example-actor flag (troupe-run/troupe#232, 2026-11-01).
That makes "audition" a product term, and the brand guide's §6 is where each product term gets its status. Without a
row, the word has no status. It also sits close to "rehearsal" (reserved) and the `--rehearse` flag (a dry run), and
it needs to be kept clearly apart from them. This is troupe-run/website#85, which pairs with troupe-run/troupe#233,
the issue that builds `troupe init --audition` for 0.2.0.

## What Changes

- The brand guide's §6 vocabulary table gains a row for **audition**. Its status is **In use**, for
  `troupe init --audition`, which writes a working example actor from 0.2.0, and it says audition isn't a rehearsal
  (a dry run, `--rehearse`). It's "In use" now, rather than "Reserved" until 0.2.0 ships, so the row never needs a
  later edit (owner, 2026-11-02). "From 0.2.0" keeps it from claiming that the flag works today.
- troupe's glossary (`docs/prompt-book/glossary.md` on troupe's `main`) needs an **audition** row with the term's
  meaning. The vocabulary check fails while the guide keeps a term the glossary lacks. The row is troupe's to write,
  so troupe-run/troupe#257 asks for it, and it lands first. The guard won't commit the guide row while the check
  fails, so the guide row follows once troupe's row is on `main` (design D2).
- The vocabulary check gains a test that audition is in use from 0.2.0 in the guide and has a glossary row.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `vocabulary`: adds a requirement that "audition" has an in-use status in the brand guide's §6, from 0.2.0 and set
  apart from rehearsal, and a meaning in troupe's glossary.

## Impact

- `docs/brand-guide.md` §6: one table row.
- `tests/unit/vocabulary.test.ts`: one test.
- troupe-run/troupe#257: the glossary row, on the troupe roadmap board. This change can't be committed until that
  row is on troupe's `main`.
- No landing copy, page or visual changes. The docs pages that use the word are written in troupe, under #233.
