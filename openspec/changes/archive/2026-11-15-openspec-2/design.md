# Design

## Context

See proposal.md, Why. This repository's generated OpenSpec files come from the CLI's Claude Code integration with the
six default workflows: six skills in `.claude/skills/openspec-*/` and six commands in `.claude/commands/opsx/`, all
`generatedBy: "1.14.3"` (archived change `update-openspec-1-14-3`). OpenSpec 2.0.0 is installed locally from
Homebrew.

2.0 keeps one copy of each skill in `.agents/skills/`, links tool folders to it, and has `openspec update` remove what
older versions generated ([release notes](https://github.com/Fission-AI/OpenSpec/releases/tag/v2.0.0),
[upgrade guide](https://openspec.dev/docs/upgrade-to-2)). The guide maps each command to the skill of the same
workflow: `/opsx:propose` → `openspec-propose`, `/opsx:explore` → `openspec-explore`, `/opsx:apply` →
`openspec-apply-change`, `/opsx:update` → `openspec-update-change`, `/opsx:sync` → `openspec-sync-specs`,
`/opsx:archive` → `openspec-archive-change`. In Claude Code a skill is typed as `/<name>`.

Who reads the old names here: `CLAUDE.md` (workflow steps 2, 3 and 6), the `contributing` spec's scenario "A change is
proposed", the generated files themselves, the archived changes and `docs/superpowers/`. `scripts/guard.py` and
`.github/workflows/guard.yml` name them too, but they're delivered (`.github/guard-delivery.json`).

## Goals / Non-Goals

**Goals:**
- The generated files are exactly what `openspec update` 2.0.0 writes, with no hand edits.
- No live text in this repository tells a person or agent to type a `/opsx:*` command.

**Non-Goals:**
- Changing the delivered guard. That's troupe-run/infrastructure#308, delivered once this and troupe#423 have merged.
- Rewriting archived changes or `docs/superpowers/`. They record what was typed when they were written.
- Adding the optional workflows, or linking tools other than Claude Code.

## Decisions

**D1. Regenerate with the installed 2.0.0, checked by a dry run and a second run.** The dry run is the expected list;
the real run must match it exactly, and running it again must change nothing.

**D2. Commit the links as links.** The upgrade guide says to commit them like other files. The site's checks and CI
run on Linux, and the two tests that walk committed files (`scripts/tests/test_contributing.py`,
`scripts/tests/test_check.py`) read only paths for which `is_file()` holds, which a link to a directory never is.

**D3. The spec's scenario changes, not its requirement.** The requirement is about what `openspec/config.yaml`'s
`context` says; the scenario only names how an agent starts a change. The delta restates the requirement unchanged
with the scenario naming `/openspec-propose`.

## Risks / Trade-offs

- [`openspec update` touches a file outside the dry run's 25] → task 1.2 compares `git status` with the list.
- [Between this merge and infrastructure#308's delivery, the guard's messages still say `/opsx:propose`] → accepted.
  CLAUDE.md gives the skill's name, and #308 follows directly.
- [CI validates with 1.14.3 while the repository is on 2.0's layout] → task 2.3 runs 1.14.3's strict validation over
  the result.
