# Design

## Context

See proposal.md for why. The current state:

- The glossary (`src/content/docs/docs/prompt-book/glossary.md`) is a two-column Markdown table, Term | Meaning, with
  11 rows. It has gate, escalation and lineage, which the brand guide's §6 table doesn't list.
- The brand guide's §6 table is Term | Meaning | Status, with 9 kept terms and one row of three rejected words
  (`~~repertoire~~, ~~rep~~, ~~company~~ (as a product noun)`). The meanings differ from the glossary's in wording.
- "project" in `src/content/` (checked 2026-10-19), and what each means:

  | Place | Means | Change |
  |---|---|---|
  | `prompt-book/glossary.md`, the theatre row | explains a theatre | stays |
  | `programme/what-is-troupe.md:21`, "It lives in your project." | a theatre | theatre |
  | `programme/principles.md:9`, heading "Local-first, everything in your project" | a theatre | theatre |
  | `programme/principles.md:24`, "the research steps your project defines" | a theatre | theatre |
  | `copy/principles.md:7`, landing title "Local-first, everything in your project" | a theatre | theatre |
  | `copy/footer.md:3`, "a project by hps.gd" | troupe itself | stays (the attribution the config fixes) |
  | `backstage/contributing.md:27`, "the project's licence" | troupe itself | stays |
  | `blog/2026-10-10-methodology-bake-off.md:16`, `:183` | the bake-off arms' own projects | stays (dated post) |

- "TBC" for the house is in the house page's title and purpose, the glossary, and the brand guide's §6 and §10.
- troupe's own specs use "stage" (the `stages` capability, lineage's `stage` field). "system" as an actor kind and
  "cue" are decided (troupe-run/troupe#15, 2026-10-11) but in no troupe spec yet.

## Goals / Non-Goals

**Goals:**

- One place for meanings, one for statuses, and a test that keeps the two lists of terms the same.
- A new "project" in site copy can't land without someone recording why it isn't a theatre.

**Non-Goals:**

- Moving the glossary to troupe-run/troupe. That's #23. This design only keeps the path in one place per file so the
  move is small.
- Generating the brand guide's table from the glossary, or the reverse. The two hold different things (meaning,
  status), so neither generates the other. The test checks they list the same terms.
- Adding "pack", "tour" or "ensemble" as rejected words. troupe-run/troupe#15's context lists them, but the brand
  guide never did and #22 doesn't ask for them.
- Editing the site design spec or the dated blog post.
- Sweeping "config", "repo" or "YAML". That rule is unchanged.

## Decisions

### D1. The glossary's rows

Order follows how a reader meets the words: the theatre and who's in it, then a run, then how work moves, then the
record, then what's installed and what runs it. New and changed rows in **bold**. The text is reviewed by the owner
before it ships (task 2.3).

| Term | Meaning |
|---|---|
| theatre | A project directory with troupe config |
| role | A job in your process, such as product owner, engineer or reviewer |
| actor | Whoever holds a role: an agent or a person |
| **`system`** | **troupe acting by itself, recorded as an actor. It's how lineage shows a change troupe observed, such as a merge** |
| cast | The actors assigned to a performance |
| performance | One run of your process |
| **rehearsal** | **A dry run of a performance** |
| **stage** | **Where an actor runs: on the host, in a container, or elsewhere** |
| notes | What a run teaches, fed into the next one |
| gate | A point where work waits for a decision from whoever owns it |
| escalation | How an agent gets a decision: research first, then a brief to the right person |
| **cue** | **An open request to a role, with a brief. A gate raises one, and so does an escalation that can't resolve itself. The name is provisional** |
| lineage | The record of who made each change, who approved it, and when |
| guest | An installable pack that adds to troupe |
| **the house** | **The long-lived local process that runs troupe on your machine** |

- "theatre" takes the decision's own wording ("a theatre is a project directory with troupe config"). "config" stays:
  it's the technical term, and the rule on it is unchanged.
- `system` and cue go in because readers will meet them: lineage shows `system` as the actor for what troupe observed,
  and cues are what notifications and the inbox show. Both are decided. The glossary already defines words ahead of
  the feature (cast, guest, rehearsal), so this isn't a claim that they work. Cue says it's provisional in its own
  meaning, because a reader of the docs never sees the brand guide's status.
- Alternative: leave `system` and cue out until troupe specs them. Rejected, because #22 asks for them if they're
  user-facing, and both are, by the decision that made them.

### D2. The brand guide's §6 table: Term | Status, one row per word

```markdown
**Product vocabulary.** What each term means is in the
[glossary](../src/content/docs/docs/prompt-book/glossary.md) (published at
<https://troupe.run/docs/prompt-book/glossary/>). It's the single source. This table holds each term's status.
```

| Term | Status |
|---|---|
| theatre, role, actor, performance | In use |
| `system` | Decided 2026-10-11: the actor kind for troupe acting by itself |
| stage | In use, 2026-10-19 |
| the house | Agreed, 2026-10-19 |
| gate, escalation, lineage | In use |
| cast | Reserved |
| rehearsal | Reserved, 2026-10-19: ahead of the feature that builds it |
| notes | Landing-page term, 2026-10-07 |
| guest | Decided "for now" |
| cue | Provisional, 2026-10-11 |
| repertoire, rep | Rejected: long and easy to get wrong |
| company (as a product noun) | Rejected: clashes with a SaaS tenant |
| part | Rejected, 2026-10-19: "role" is clearer, and the two were never told apart |
| house rules | Rejected, 2026-10-19: say "policy". Policy can be set at house level too, so "house rules" would read as that level only |

The rows above group terms for reading here; the real table has **one row per term**, so the test can read it without
a parser for lists. The `~~strikethrough~~` on rejected words goes: "Rejected" in the status says it, and a struck
word in a table is harder to read. The reasons for repertoire and company are the ones troupe-run/troupe#15 records.

"Theatre in headings and visuals", the docs section labels and the "don't" list stay as they are.

### D3. Brand guide §7 and §10

§7's bullet becomes:

> say "theatre" for a theatre, in headings and body copy alike, never mixed with "project". "Project" appears only to
> explain what a theatre is ("a theatre is a project directory with troupe config"). Say what it is in plain words,
> not "repo", "YAML" or "config", except where the technical term is genuinely necessary (owner review, 2026-10-08;
> "theatre" decided 2026-10-19, troupe-run/troupe#15).

This sits beside §6's rule ("theatre in headings and visuals, plain words in body copy"). "Theatre" is now a product
noun like "actor" and "role", which body copy already uses, so the two don't conflict: the plain-words rule is about
stage devices, not the product's nouns. §6 says that in one added sentence.

§10 loses its last bullet.

### D4. Site copy

| Place | Now | Proposed |
|---|---|---|
| `what-is-troupe.md:21` | **It lives in your project.** Everything is kept in git, on your machine. There is no hosted service. | **It lives in your theatre**, the project directory troupe works in. Everything is kept in git, on your machine. There is no hosted service. |
| `principles.md:9` | ## Local-first, everything in your project | ## Local-first, everything in your theatre |
| `principles.md:11` (body under it) | Config, history and decisions live in git, on your machine. … | A theatre is your project directory. Its config, history and decisions live in git, on your machine. … |
| `principles.md:24` | the research steps your project defines | the research steps your theatre defines |
| `copy/principles.md:7` title | Local-first, everything in your project | Local-first, everything in your theatre |
| `copy/principles.md:7` body | Config, history and decisions live in git, on your machine. No hosted service required. | A theatre is your project directory: its config, history and decisions live in git, on your machine. No hosted service required. |

The landing page has never said "theatre", so its first use explains it in the same principle (the spec's landing
scenario). That's the one place "project" is added, as an explanation. The owner reviews this text before it ships.

The house page (`the-company/the-house.md`): title "The house (daemon)", matching "Guests (packs)". Description "The
local daemon." stays. Purpose "The long-lived local process that runs your theatres."

### D5. The tests: `tests/unit/vocabulary.test.ts`

Vitest, reading files from the repo root like `token-discipline.test.ts`. Paths are constants at the top
(`GLOSSARY`, `BRAND_GUIDE`), so #23's move changes one line.

- **Tables.** A small function reads the first Markdown table after a heading: rows split on `|`, header and divider
  dropped, backticks stripped from the term. §6 is found by its heading `## 6.`, ending at the next `## `.
- **Same terms.** Kept terms (status not starting "Rejected") equal the glossary's terms, as sets; the failure lists
  each side's extras. Rejected terms are absent from the glossary.
- **No meanings in the guide.** §6's table header is exactly Term | Status.
- **The house.** The glossary, the house page and the brand guide contain no `TBC` and no "isn't final" (case
  insensitive). §10 doesn't mention "the house".
- **Decided terms present.** stage, rehearsal, `system` and cue have glossary rows (a named test of its own, so a
  later edit that drops one fails by name, not only as a set difference).
- **"project" record.** A list in the test of `{ file, text, reason }`, where `text` is a fragment of the line. Every
  line under `src/content/` matching `/\bprojects?\b/i` must match a record by file and fragment, and every record must
  match at least one line. Fragments, not line numbers, so an unrelated edit above doesn't break it. The failure names
  the file, line number and line. The test's name says what it checks: that each "project" is recorded with a reason,
  not that each one is correct. Whether a recorded use is right is the reviewer's call.

Alternative: a lint rule or a remark plugin. Rejected: a unit test runs in the existing `check.py` and CI step with no
new dependency, and the content is a handful of files.

### D6. `openspec/config.yaml`'s context

Two lines repeat the old rules and would steer the next change wrong:

- "mark unagreed terms ("the house") as TBC" becomes "mark unagreed terms as provisional, as the brand guide's §6
  says", and "Use the product vocabulary with the brand guide's exact meanings" becomes "with the glossary's meanings
  (the single source) and the brand guide's statuses".
- "User-facing copy says "project", not "repo", "YAML" or "config"…" becomes "User-facing copy says "theatre", never
  mixed with "project", which appears only to explain what a theatre is. Not "repo", "YAML" or "config", unless the
  technical term is needed."

## Risks / Trade-offs

- [A reader of the brand guide has to follow a link to see a meaning] → That's the decision. The link names both the
  source file and the published page.
- [The "project" record is hand-maintained] → It fails both ways: an unrecorded use fails, and so does a record whose
  text has gone. That's the trigger to update it.
- [The table parser is simple and would misread a table with `|` inside a cell] → No cell has one today. A misread
  fails the term-set test loudly rather than passing.
- [Landing and docs copy changes are owner-reviewed text] → Shown to the owner as text with the built pages before the
  pull request is called done (task 4.3).

## Migration Plan

Merge to main deploys it. Rollback is a revert. When #23 moves the glossary to troupe, the guide's link and the test's
`GLOSSARY` constant change with it.
