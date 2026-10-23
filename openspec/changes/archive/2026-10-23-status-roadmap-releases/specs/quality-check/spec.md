# Spec Delta

## ADDED Requirements

### Requirement: The fixture build reads fixture milestones
The fixture build SHALL read the release milestones from a fixture file kept in this repository, never from
troupe-run/infrastructure, so that the roadmap on `/status/` is tested against releases that don't change. The file
SHALL be put where the build reads it for the run only, and removed afterwards.

#### Scenario: The roadmap with releases
- **WHEN** the fixture build runs, with its troupe tagged `troupe-v0.1.0`, `troupe-v0.1.1` and `troupe-v0.2.0`
- **THEN** its `/status/` lists the fixture milestones in version order, shows 0.1.0 and 0.2.0 as released with
  their tags' dates and no date on any other, whatever troupe-run/infrastructure declares

#### Scenario: Nothing is left behind
- **WHEN** the fixture build finishes, passing or failing
- **THEN** the folder that held the fixture milestones is gone
