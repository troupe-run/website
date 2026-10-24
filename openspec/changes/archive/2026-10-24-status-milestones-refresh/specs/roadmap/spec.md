# Spec Delta

## ADDED Requirements

### Requirement: An earlier build never keeps an old list
Every build SHALL publish `/status/` from the milestones, release tags and page words it read, even when it starts
from an earlier build's cache and nothing in this repository has changed since. What an earlier build rendered SHALL
NOT stand in for the current list or status line.

#### Scenario: Milestones renumbered, website unchanged
- **WHEN** a build runs on an earlier build's cache, with the same website commit, after a milestone was renumbered
  in `tofu/milestones.json`
- **THEN** `/status/` lists the milestones in their new order, under their new versions

#### Scenario: A patch release, website unchanged
- **WHEN** a build runs on an earlier build's cache, with the same website commit, after troupe was tagged with a
  patch release
- **THEN** `/status/`'s status line names that patch release as the latest

#### Scenario: Previewing a milestone edit twice
- **WHEN** someone builds the site with `TROUPE_MILESTONES` set to their infrastructure checkout, edits a description
  there, and builds again
- **THEN** the second build's `/status/` shows the edited description
