## MODIFIED Requirements

### Requirement: The release list comes from the declared milestones
Each build SHALL read `tofu/milestones.json` from troupe-run/infrastructure's `main` and SHALL list on `/status/` every
milestone in it, and no other release. A milestone that's out SHALL be listed under "Releases", and every other under
"Milestones", so each milestone appears in exactly one of the two. Each entry SHALL show the milestone's title (its
version) and its description, word for word. Neither list SHALL be written into this repository by hand.

#### Scenario: The planned releases
- **WHEN** the site is built while `tofu/milestones.json` declares 0.1.0 to 0.20.0 and 1.0.0, and troupe has no
  release tags
- **THEN** `/status/` lists 21 milestones under "Milestones", each with its version and the description from the
  file, and none under "Releases"

#### Scenario: Each milestone in one list
- **WHEN** the site is built while troupe has `troupe-run-v0.1.0` and `troupe-run-v0.2.0`, and the file declares
  0.1.0 to 0.20.0 and 1.0.0
- **THEN** "Releases" lists 0.1.0 and 0.2.0, "Milestones" lists the other 19, and no version is in both

#### Scenario: A milestone is re-described
- **WHEN** a milestone's description changes in `tofu/milestones.json` on infrastructure's `main`, and the site is
  built again
- **THEN** `/status/` shows the new description, with no edit to this repository

#### Scenario: A milestone is renumbered or added
- **WHEN** a milestone is renamed from 0.12.0 to 0.13.0, or a new milestone is declared, and the site is built again
- **THEN** `/status/` shows it under its new version, in its new place, with no edit to this repository

### Requirement: The page says which releases are out, and when
A milestone SHALL be shown as released, under "Releases", when troupe-run/troupe has the bundle's release tag for its
version (`troupe-run-v0.1.0` for 0.1.0), with the date of that tag. A milestone without its tag SHALL be under
"Milestones", with no date and no other mark. The status SHALL name the latest bundle release, or say nothing has been
released yet. Tags of troupe's other components, core's `troupe-v*` among them, SHALL NOT mark a release.

#### Scenario: Before the first release
- **WHEN** troupe has no release tags
- **THEN** no milestone shows a date, every milestone is under "Milestones", and the status says nothing has been
  released yet

#### Scenario: After a release
- **WHEN** troupe has `troupe-run-v0.1.0`, tagged on 2026-11-05, and no later release tag
- **THEN** "Releases" lists only 0.1.0, showing "Released 2026-11-05", no milestone under "Milestones" shows a date,
  and the status names 0.1.0 as the latest release

#### Scenario: A patch release
- **WHEN** troupe has `troupe-run-v0.1.1` but the milestones declare no 0.1.1
- **THEN** both lists are unchanged by it: no entry is added for 0.1.1, and the status names 0.1.1 as the latest
  release

#### Scenario: Core's tag disagrees with the bundle's
- **WHEN** troupe has `troupe-run-v0.2.0` and `troupe-v0.3.0`, and the milestones declare 0.2.0 and 0.3.0
- **THEN** "Releases" lists 0.2.0, "Milestones" lists 0.3.0 with no date, and the status names 0.2.0 as the latest
  release

#### Scenario: Core only, no bundle
- **WHEN** troupe has `troupe-v0.1.0` and no `troupe-run-v*` tag
- **THEN** every milestone is under "Milestones", and the status says nothing has been released yet

### Requirement: A section with nothing in it is left out
When no milestone is released, `/status/` SHALL NOT show the "Releases" section: no heading, no empty list, and no
entry for it in "On this page". When every milestone is released, the page SHALL NOT show the "Milestones" section,
its introduction included. A section that's left out SHALL NOT be replaced with words of its own.

#### Scenario: Before the first release
- **WHEN** troupe has no release tags
- **THEN** `/status/` has no "Releases" heading, and "On this page" lists Status and Milestones

#### Scenario: After the first release
- **WHEN** troupe has `troupe-run-v0.1.0`
- **THEN** "On this page" lists Status, Releases and Milestones, in that order

#### Scenario: Every milestone released
- **WHEN** troupe has a release tag for every milestone the file declares
- **THEN** `/status/` has no "Milestones" heading and no text from its introduction, and "Releases" lists every
  milestone
