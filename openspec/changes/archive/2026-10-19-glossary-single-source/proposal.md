# Proposal

## Why

troupe's vocabulary is written down twice: as the brand guide's §6 table and as the site's glossary page. The two
already disagree in wording, and neither has the terms troupe-run/troupe#15 settled (owner, 2026-10-19): "the house" is
agreed, "stage" and "rehearsal" are added, "part" and "house rules" are dropped, and the product noun is "theatre"
everywhere, never mixed with "project". That decision makes the site's glossary page the single source and leaves the
brand guide only the brand rules (#22).

The docs are moving to troupe-run/troupe (troupe-run/troupe#120, #23). The owner's update on #22 says this change goes
ahead here first, and the glossary file moves with the docs later.

## What Changes

- **Glossary** (`src/content/docs/docs/prompt-book/glossary.md`):
  - "the house" loses "The name isn't final".
  - Adds **stage** (where an actor runs: on the host, in a container, elsewhere) and **rehearsal** (the dry-run
    counterpart of a performance).
  - Adds the decided terms that readers will meet: **`system`**, the kind of actor that is troupe acting by itself
    (troupe-run/troupe#15, 2026-10-11), and **cue**, an open request addressed to a role, with a brief, marked
    provisional.
- **Brand guide §6:** the vocabulary table loses its meanings and links to the glossary. It keeps each term's status
  and the rejected words, and adds two rejections with their reasons: "part" (role is clearer) and "house rules" (say
  "policy"). The "TBC" note on "the house" goes; its status becomes agreed.
- **Brand guide §7:** the voice rule changes from "say project" to "say **theatre**, never mixed with project".
  "Project" appears only to explain what a theatre is. "Not repo, YAML or config" stays.
- **Brand guide §10:** the open point on "the house" and "house rules" is removed.
- **Site copy:** body text that says "project" for a theatre says "theatre". That's three docs lines and one landing
  principle. Each "project" that stays in the docs and landing copy (troupe as a project) is listed with its reason.
  The blog isn't checked: its posts are dated.
- **"The house" page:** its title and purpose drop "name TBC" and "The name isn't final".
- **`openspec/config.yaml` context:** the two lines that repeat the old rules ("mark 'the house' as TBC", "say
  project") are updated to match the guide, so the next change isn't planned against them.
- **Drift guards:** unit tests that fail when the brand guide's §6 holds a term the glossary doesn't define, when the
  guide carries meanings again, or when a new "project" appears in the docs or landing copy without a reviewed reason.

## Capabilities

### New Capabilities

- `vocabulary`: where troupe's product vocabulary is defined (the glossary page, as the single source), what the brand
  guide keeps (status and rejected words, linked to the glossary), and that site copy names a theatre "theatre".

### Modified Capabilities

None.

## Impact

- Content: `src/content/docs/docs/prompt-book/glossary.md`, `src/content/docs/docs/the-company/the-house.md`,
  `src/content/docs/docs/programme/what-is-troupe.md`, `src/content/docs/docs/programme/principles.md`,
  `src/content/copy/principles.md` (landing copy, reviewed by the owner as text before it ships).
- Docs: `docs/brand-guide.md` §6, §7 and §10. `openspec/config.yaml`'s context.
- Tests: a new `tests/unit/vocabulary.test.ts`. The e2e glossary test at 320px still covers the wider table.
- The site design spec (`docs/superpowers/specs/2026-10-07-troupe-run-site-design.md`) still says "name TBC" and
  "say project". It's a dated record, and this change's spec replaces those two decisions, so it isn't edited.
- When #23 moves the docs to troupe, the glossary's path changes. The brand guide's link and the test's path are each
  in one place, so that move updates two lines.
- Rollback: revert the commits. Nothing outside this repository changes.
