# Tasks

## 1. The sidebar order

- [x] 1.1 Add `runtimes` after `bring-your-own-agent` in the Stagecraft section of `src/lib/docs-nav.ts`. Verify that a version lacking the page still builds its sidebar: `ordered` filters to the pages a version has (read the code), and the unit tests pass.
- [x] 1.2 Give runner, runtime and engine a status in the brand guide's §6, as troupe's glossary now has rows for them; `tests/unit/vocabulary.test.ts` passes.
- [x] 1.3 `uv run scripts/check.py` passes.

## Workflow follow-up

- `/openspec-archive-change` before merging; after the merge, comment on #143 with the PR and the archived change.
