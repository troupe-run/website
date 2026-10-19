# Spec Delta

## Purpose

Says where troupe's product vocabulary is defined and how the site uses it: the glossary page is the single source of
each term's meaning, the brand guide keeps only the brand rules about the words, and site copy names a theatre
"theatre".

## ADDED Requirements

### Requirement: The glossary page defines every term in the vocabulary
The site's glossary page SHALL hold the meaning of every product term the brand guide's §6 keeps (any status but
rejected), one row per term, and no other terms. A rejected word SHALL NOT have a row. Each meaning SHALL
follow the owner's decision recorded for that term (troupe-run/troupe#15).

#### Scenario: A kept term the glossary lacks
- **WHEN** the brand guide's §6 lists a term that isn't rejected and the glossary has no row for it
- **THEN** the check fails and names the term

#### Scenario: A glossary term with no status
- **WHEN** the glossary has a row for a term the brand guide's §6 doesn't list
- **THEN** the check fails and names the term, so a new word gets a status as well as a meaning

#### Scenario: A rejected word in the glossary
- **WHEN** the glossary has a row for a word the brand guide's §6 lists as rejected
- **THEN** the check fails and names the word

#### Scenario: The terms decided on 2026-10-19 are defined
- **WHEN** the glossary page is built
- **THEN** it has rows for stage (where an actor runs: on the host, in a container, elsewhere), rehearsal (the dry-run
  counterpart of a performance), `system` (troupe acting by itself) and cue (an open request addressed to a role,
  marked provisional)

### Requirement: The brand guide holds no meanings
The brand guide's §6 SHALL link to the glossary page for what each term means, and its vocabulary table SHALL hold
each term's status only. The rejected words SHALL stay in the guide, each with its reason where the owner gave one.

#### Scenario: The guide's table carries a meaning again
- **WHEN** the brand guide's §6 vocabulary table has a column other than the term and its status
- **THEN** the check fails

#### Scenario: The guide links to the glossary
- **WHEN** the brand guide's §6 is read
- **THEN** it links to the glossary page's source in this repository and to its published page

#### Scenario: Words dropped on 2026-10-19 are listed as rejected
- **WHEN** the brand guide's §6 is read
- **THEN** "part" is rejected because role is clearer, and "house rules" is rejected in favour of "policy"

### Requirement: "The house" is an agreed name
Nothing on the site or in the brand guide SHALL mark "the house" as not final: no "TBC", no "name isn't final", and no
open point about its name.

#### Scenario: The house page and the glossary
- **WHEN** the house's docs page and the glossary are built
- **THEN** neither says "TBC" or that the name isn't final

#### Scenario: The brand guide
- **WHEN** the brand guide is read
- **THEN** "the house" has status agreed, and §10 has no open point on "the house" or "house rules"

### Requirement: Site copy says "theatre", not "project", for a theatre
Body copy, headings and landing copy SHALL call a theatre "theatre", never "project". "Project" SHALL appear only to
explain what a theatre is, or where it means something other than a theatre (troupe itself as a project, or a dated
blog post's own projects). Every "project" that stays SHALL be recorded with its reason.

#### Scenario: A new "project" in site copy
- **WHEN** a file under `src/content/` gains the word "project" or "projects" at a place not recorded with a reason
- **THEN** the check fails and names the file and the line

#### Scenario: A recorded "project" that has gone
- **WHEN** a recorded place no longer says "project"
- **THEN** the check fails and names the stale record, so the record can't outlive the copy it covers

#### Scenario: The landing page explains the word when it first uses it
- **WHEN** the landing page's principles say "theatre"
- **THEN** the same principle says what a theatre is, in plain words
