# Spec Delta

## ADDED Requirements

### Requirement: "Audition" is in use from 0.2.0, apart from rehearsal
The brand guide's §6 SHALL list "audition" with an In use status, dated 2026-11-01 (troupe-run/troupe#232). Its status
SHALL name `troupe init --audition` and the release it arrives in (0.2.0), and say audition is not a rehearsal (the
`--rehearse` dry run). troupe's glossary SHALL have a row for audition, as for every kept term.

#### Scenario: The guide lists audition as in use from 0.2.0
- **WHEN** the brand guide's §6 is read
- **THEN** audition has a status starting "In use", dated 2026-11-01, that names `troupe init --audition` and 0.2.0,
  and says it isn't a rehearsal

#### Scenario: The glossary defines audition
- **WHEN** the glossary page is built from troupe's `main`
- **THEN** it has a row for audition

#### Scenario: The glossary lacks audition
- **WHEN** troupe's glossary on `main` has no row for audition
- **THEN** the check fails and names audition, as for any kept term the glossary lacks
