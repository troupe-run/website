# Spec Delta

## ADDED Requirements

### Requirement: The fixture troupe has protocol releases
The fixture troupe SHALL also hold `protocol/schemas/`, with `protocol-v*` tags of more than one major version and a
schema changed on `main` after the last tag, so that every `/protocol/` copy, the id rewrite and the reference check
are tested before troupe has a protocol release. Its tags SHALL be made only in the fixture's temporary repository.

#### Scenario: Before troupe's first protocol release
- **WHEN** the check runs while troupe-run/troupe has no `protocol-v*` tag
- **THEN** the fixture build has `/protocol/`, `/protocol/next/`, a copy for each major version and one for each tag,
  and the protocol tests run against it

#### Scenario: A broken id rewrite
- **WHEN** a change makes a major-version copy keep troupe's unversioned `$id`s
- **THEN** the tests of the fixture build fail, naming the file and the id
