# Design

## Context

CLAUDE.md's "How work happens here" has six steps; step 5 ends "It's merged by rebase". `openspec/config.yaml`'s
`context` has a **Working** list with nothing about Claude's review. Both files are in `scripts/check-paths.toml`'s
`skip` group, and the `contributing` spec says CLAUDE.md links the org's development-workflow guide rather than
restating its rules.

What's live on GitHub (read on 2026-10-28): `main`'s ruleset "protect main" has a `merge_queue` rule (method
`REBASE`, grouping `ALLGREEN`), requires `test` and `guard (workflow rules)`, and has
`required_review_thread_resolution: true`. The repository has `allow_auto_merge: true`. infrastructure#194 and #197
are both closed.

The two sources to match are infrastructure's CLAUDE.md (its steps 5 and 6) and the org's CONTRIBUTING.md (its steps
4 and 5).

## Goals / Non-Goals

**Goals:**

- An agent reading CLAUDE.md knows to act on the review before archiving, and how to merge through the queue.
- Every change proposed from now on has the review step in its tasks.

**Non-Goals:**

- Restating the review's tiers table or the queue's settings. The org's guide and development-workflow.md own them.
- A test that pins the wording. See D4.

## Decisions

### D1. CLAUDE.md gains a review step, not only a merge-queue line

#71 asks only for step 5's merge wording, and #72 only for the config line. But CLAUDE.md's steps are the order an
agent works in, and the org's guide and infrastructure's CLAUDE.md both put "Claude's review is acted on" as its own
step between the pull request and the archive. Without it, CLAUDE.md lists a path that the ruleset no longer lets
finish (an unresolved conversation blocks the merge). So the steps become seven:

1. An issue. 2. An OpenSpec change. 3. `/opsx:apply`. 4. A pull request (unchanged).
5. **Claude's review is acted on**, after the review of the last push: fix or answer each finding, resolve only nits,
   and raise decisions and disputed must-fixes with the owner. The review resolves its own must-fixes once they're
   addressed; for a must-fix answered without a push, re-run the last `claude review` run (`gh run rerun <id>`). A
   merge needs every conversation resolved (link: development-workflow.md, "Claude's review").
6. **`/opsx:archive`** runs on the branch before merging, so the pull request lands code, tests and specs together.
   Then it's added to the merge queue (`gh pr merge <n>`, or **Merge when ready**), which lands it by rebase once
   `test` and `guard (workflow rules)` pass on the queued commit. `gh pr merge <n> --rebase --admin` skips the queue;
   it's for emergencies, such as clearing a stuck queue.
7. **After the merge** (unchanged).

Step 5's wording follows infrastructure's step 5. The exact text is reviewed by the owner in the pull request.

Alternative: only #71's line, and leave the review to the config line. Rejected: config.yaml reaches only
`/opsx:propose`'s artifacts, while CLAUDE.md is what an agent reads at the start of every session, including one that
picks up a change proposed before this one.

### D2. The config line is infrastructure's current one, not #72's quote

#72 quotes infrastructure's line as it was when the issue was opened. Infrastructure's `openspec/config.yaml` has since
added a clause: after answering a must-fix without a push, re-run the last `claude review` run so the review judges
the reply. That clause is about the same review workflow, delivered here too, so website takes the current line, with
the guide's path written as `troupe-run/infrastructure docs/development-workflow.md` since the file isn't in this
repository. It goes at the end of **Working**, as in infrastructure.

### D3. The merge step names who queues it by command, not by role

infrastructure's CLAUDE.md says "The owner merges by rebase, through the merge queue". #71 asks for the commands
instead, and website's step 5 has never said who merges. This change keeps that: it names the commands and leaves who
runs them to the ruleset and the owner.

### D4. No test pins the text

As in `use-org-contributing-guide` (its D4): the scenarios are checked by reading CLAUDE.md and config.yaml against
the spec, and the owner reviews the text in the pull request. A test that matched prose would fail on every rewording
and catch no wrong instruction. `openspec/**` and `CLAUDE.md` are skipped paths, and `scripts/tests/test_check.py`
forbids a gate source naming them anyway.

The config line is checked end to end in one way that is automatic: `openspec instructions tasks --change <name>
--json` prints the context, and the task in 2.2 reads the line in that output.

## Risks / Trade-offs

- [infrastructure's wording changes again and website's drifts] → The link to development-workflow.md is the source
  of the rules; the restated lines are short. A future change in infrastructure that alters the steps opens an issue
  here, as #71 and #72 were.
- [Changes already in flight don't have the review task] → None are in flight (`openspec list` shows none besides this
  one). CLAUDE.md's step 5 covers any that are proposed before an agent reloads the context.
