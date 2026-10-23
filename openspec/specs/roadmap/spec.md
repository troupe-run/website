# roadmap Specification

## Purpose

What `/status/` says about where troupe is and the releases it's heading for. The release list comes from the
milestones troupe-run/infrastructure declares, and which ones are released, and when, comes from troupe's release
tags, so the page never needs a second edit when the plan changes.

## Requirements

### Requirement: The release list comes from the declared milestones
Each build SHALL read `tofu/milestones.json` from troupe-run/infrastructure's `main` and SHALL list on `/status/` every
milestone in it, and no other release. Each entry SHALL show the milestone's title (its version) and its description,
word for word. The list SHALL NOT be written into this repository by hand.

#### Scenario: The planned releases
- **WHEN** the site is built while `tofu/milestones.json` declares 0.1.0 to 0.20.0 and 1.0.0
- **THEN** `/status/` lists 21 releases, each with its version and the description from the file

#### Scenario: A milestone is re-described
- **WHEN** a milestone's description changes in `tofu/milestones.json` on infrastructure's `main`, and the site is
  built again
- **THEN** `/status/` shows the new description, with no edit to this repository

#### Scenario: A milestone is renumbered or added
- **WHEN** a milestone is renamed from 0.12.0 to 0.13.0, or a new milestone is declared, and the site is built again
- **THEN** `/status/` shows it under its new version, in its new place, with no edit to this repository

### Requirement: Releases are listed in version order
The list SHALL be ordered by version, compared as numbers part by part (0.2.0 before 0.10.0), whatever order the file
declares them in. 1.0.0 SHALL therefore come after every 0.x release.

#### Scenario: Two-digit minors
- **WHEN** the file declares 0.10.0 before 0.2.0
- **THEN** `/status/` lists 0.2.0 before 0.10.0

### Requirement: The page says which releases are out, and when
A milestone SHALL be shown as released when troupe-run/troupe has the release tag for its version (`troupe-v0.1.0`
for 0.1.0), with the date of that tag. A milestone without its tag SHALL show no date and no other mark. The status
SHALL name the latest release, or say nothing has been released yet.

#### Scenario: Before the first release
- **WHEN** troupe has no release tags
- **THEN** no release shows a date, and the status says nothing has been released yet

#### Scenario: After a release
- **WHEN** troupe has `troupe-v0.1.0`, tagged on 2026-11-05, and no later release tag
- **THEN** 0.1.0 shows "Released 2026-11-05", no other release shows a date, and the status names 0.1.0 as the
  latest release

#### Scenario: A patch release
- **WHEN** troupe has `troupe-v0.1.1` but the milestones declare no 0.1.1
- **THEN** the list is unchanged by it: no entry is added for 0.1.1, and the status names 0.1.1 as the latest release

### Requirement: The page shows no progress counts or planned dates
`/status/` SHALL NOT show issue counts, percentages, a "current" or "in progress" mark, or a planned date for a
release. It SHALL say that each release is planned, that the order can change, and that only a release that's out has
a date, and SHALL link to troupe's milestones and to the troupe roadmap board for the issues behind each release.

#### Scenario: Reading the page
- **WHEN** a reader opens `/status/`
- **THEN** it has links to `https://github.com/troupe-run/troupe/milestones` and the troupe roadmap board, and no
  count, percentage, progress mark or date beside any release that isn't out

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
The status, the section headings and the text explaining how to read the roadmap SHALL be written in this repository
and reviewed by the owner as text. The words the list adds to a release that's out ("Released" and its date) and the
status line SHALL live in the site's copy files. A release's description SHALL be changed in troupe-run/infrastructure, never
here.

#### Scenario: Improving a release's wording
- **WHEN** a reader follows "Improve this page" on `/status/` to fix a release's description
- **THEN** the page's source says, beside where the list appears, that the descriptions come from
  `tofu/milestones.json` in troupe-run/infrastructure
