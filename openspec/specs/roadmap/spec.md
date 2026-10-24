# roadmap Specification

## Purpose

What `/status/` says about where troupe is and the releases it's heading for. The release list comes from the
milestones troupe-run/infrastructure declares, and which ones are released, and when, comes from troupe's release
tags, so the page never needs a second edit when the plan changes.

## Requirements

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
- **WHEN** the site is built while troupe has `troupe-v0.1.0` and `troupe-v0.2.0`, and the file declares 0.1.0 to
  0.20.0 and 1.0.0
- **THEN** "Releases" lists 0.1.0 and 0.2.0, "Milestones" lists the other 19, and no version is in both

#### Scenario: A milestone is re-described
- **WHEN** a milestone's description changes in `tofu/milestones.json` on infrastructure's `main`, and the site is
  built again
- **THEN** `/status/` shows the new description, with no edit to this repository

#### Scenario: A milestone is renumbered or added
- **WHEN** a milestone is renamed from 0.12.0 to 0.13.0, or a new milestone is declared, and the site is built again
- **THEN** `/status/` shows it under its new version, in its new place, with no edit to this repository

### Requirement: Releases are listed in version order
"Releases" SHALL come before "Milestones" on the page. Each list SHALL be ordered by version, compared as numbers part
by part (0.2.0 before 0.10.0), whatever order the file declares them in. 1.0.0 SHALL therefore come after every 0.x
milestone in its list.

#### Scenario: Two-digit minors
- **WHEN** the file declares 0.10.0 before 0.2.0, and neither is released
- **THEN** "Milestones" lists 0.2.0 before 0.10.0

#### Scenario: Past before future
- **WHEN** 0.1.0 and 0.2.0 are released and later milestones aren't
- **THEN** the page shows "Releases", with 0.1.0 before 0.2.0, above "Milestones"

### Requirement: The page says which releases are out, and when
A milestone SHALL be shown as released, under "Releases", when troupe-run/troupe has the release tag for its version
(`troupe-v0.1.0` for 0.1.0), with the date of that tag. A milestone without its tag SHALL be under "Milestones", with
no date and no other mark. The status SHALL name the latest release, or say nothing has been released yet.

#### Scenario: Before the first release
- **WHEN** troupe has no release tags
- **THEN** no milestone shows a date, every milestone is under "Milestones", and the status says nothing has been
  released yet

#### Scenario: After a release
- **WHEN** troupe has `troupe-v0.1.0`, tagged on 2026-11-05, and no later release tag
- **THEN** "Releases" lists only 0.1.0, showing "Released 2026-11-05", no milestone under "Milestones" shows a date,
  and the status names 0.1.0 as the latest release

#### Scenario: A patch release
- **WHEN** troupe has `troupe-v0.1.1` but the milestones declare no 0.1.1
- **THEN** both lists are unchanged by it: no entry is added for 0.1.1, and the status names 0.1.1 as the latest
  release

### Requirement: The page shows no progress counts or planned dates
`/status/` SHALL NOT show issue counts, percentages, a "current" or "in progress" mark, or a planned date for a
milestone. Its sections SHALL be Status, Releases and Milestones, in that order, with no section explaining how to
read them (owner, 2026-10-24).

#### Scenario: Reading the page
- **WHEN** a reader opens `/status/`
- **THEN** it has no count, percentage, progress mark or date beside any milestone under "Milestones", and no "How to
  read it" section"

### Requirement: A malformed milestones file stops the build
The build SHALL fail when `tofu/milestones.json` isn't JSON, has no `milestones` list, or has a milestone whose title
isn't `MAJOR.MINOR.PATCH`, whose description is missing or empty, or whose title another milestone already has. The
error SHALL name the file, the milestone and the fix. Keys the page doesn't read SHALL be ignored.

#### Scenario: A title that isn't a version
- **WHEN** a milestone's title is `v0.3`
- **THEN** the build fails, naming `tofu/milestones.json`, `v0.3` and the form a title must have

#### Scenario: Two milestones with one title
- **WHEN** two milestones are titled 0.4.0
- **THEN** the build fails, naming `tofu/milestones.json` and 0.4.0

#### Scenario: A key the page doesn't read
- **WHEN** a milestone has a `key` or `state` field
- **THEN** the build succeeds and the field doesn't appear on the page

### Requirement: A milestones fetch failure stops the build
When the build can't read troupe-run/infrastructure, it SHALL fail, naming the repository and the error, and saying
how to build from a local checkout. It SHALL NOT build from a copy fetched earlier, nor without the list.

#### Scenario: Offline
- **WHEN** the build runs with no network and no local infrastructure checkout named
- **THEN** it fails, naming troupe-run/infrastructure and the git error, and saying to set `TROUPE_MILESTONES`

### Requirement: The milestones can be read from a local infrastructure checkout
When `TROUPE_MILESTONES` names a directory, the build SHALL read `tofu/milestones.json` from that checkout's working
tree, uncommitted edits included. A `TROUPE_MILESTONES` that's set but empty, or names a folder with no
`tofu/milestones.json`, SHALL stop the build, naming the variable and its value.

#### Scenario: Previewing a milestone edit
- **WHEN** someone edits a description in their infrastructure checkout and builds the site with `TROUPE_MILESTONES`
  set to it
- **THEN** `/status/` shows the edited description

#### Scenario: A wrong path
- **WHEN** `TROUPE_MILESTONES` is set to a folder with no `tofu/milestones.json`
- **THEN** the build fails, naming `TROUPE_MILESTONES`, the path and the file it must contain

### Requirement: The page's own words are written here, the list's are not
The status, the section headings and the introduction to the milestones SHALL be written in this repository
and reviewed by the owner as text. The words the list adds to a release that's out ("Released" and its date) and the
status line SHALL live in the site's copy files. A release's description SHALL be changed in troupe-run/infrastructure, never
here.

#### Scenario: Improving a release's wording
- **WHEN** a reader follows "Improve this page" on `/status/` to fix a release's description
- **THEN** the page's source says, beside where each list appears, that the descriptions come from
  `tofu/milestones.json` in troupe-run/infrastructure

### Requirement: A section with nothing in it is left out
When no milestone is released, `/status/` SHALL NOT show the "Releases" section: no heading, no empty list, and no
entry for it in "On this page". When every milestone is released, the page SHALL NOT show the "Milestones" section,
its introduction included. A section that's left out SHALL NOT be replaced with words of its own.

#### Scenario: Before the first release
- **WHEN** troupe has no release tags
- **THEN** `/status/` has no "Releases" heading, and "On this page" lists Status and Milestones

#### Scenario: After the first release
- **WHEN** troupe has `troupe-v0.1.0`
- **THEN** "On this page" lists Status, Releases and Milestones, in that order

#### Scenario: Every milestone released
- **WHEN** troupe has a release tag for every milestone the file declares
- **THEN** `/status/` has no "Milestones" heading and no text from its introduction, and "Releases" lists every
  milestone

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
