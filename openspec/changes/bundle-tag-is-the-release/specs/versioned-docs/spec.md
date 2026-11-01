## MODIFIED Requirements

### Requirement: Every docs page comes from troupe-run/troupe
The site SHALL build every page under `/docs` from troupe-run/troupe's `docs/` folder, at the ref of the version it
belongs to. A page at `docs/<section>/<name>.md` SHALL publish at `/docs/<version prefix><section>/<name>/`. This
repository SHALL hold no `/docs` page content of its own.

#### Scenario: A page on troupe's main before any release
- **WHEN** troupe has no `troupe-run-v*` tag and its `main` has `docs/the-company/theatres.md`
- **THEN** the site publishes it at `/docs/the-company/theatres/`, rendered in the site's design

#### Scenario: An edit in troupe reaches the site
- **WHEN** a push to troupe's `main` changes a page's text, and the site is rebuilt
- **THEN** the page on the site shows the new text, with no change in this repository

#### Scenario: No docs content is kept here
- **WHEN** this repository's tracked files are listed
- **THEN** none is a page under `src/content/docs/docs/`

### Requirement: The latest release is at /docs/
A release is the bundle's tag, `troupe-run-vMAJOR.MINOR.PATCH`, the version people install (troupe-run/troupe#218).
When troupe has at least one, `/docs/` SHALL show the docs at the highest such tag. Before the first release, `/docs/`
SHALL show troupe's `main`.

#### Scenario: Two releases
- **WHEN** troupe has tags `troupe-run-v0.1.1` and `troupe-run-v0.2.0`
- **THEN** `/docs/` shows the pages at `troupe-run-v0.2.0`

#### Scenario: No release yet
- **WHEN** troupe has no `troupe-run-v*` tag
- **THEN** `/docs/` shows the pages on `main`, and no `/docs/next/` exists

#### Scenario: Core's tag disagrees with the bundle's
- **WHEN** troupe has tags `troupe-run-v0.2.0` and `troupe-v0.3.0`, on different commits
- **THEN** `/docs/` shows the pages at `troupe-run-v0.2.0`, and no version is published from `troupe-v0.3.0`

#### Scenario: Core only, no bundle
- **WHEN** troupe has a tag `troupe-v0.1.0` and no `troupe-run-v*` tag
- **THEN** `/docs/` shows the pages on `main`, and no `/docs/next/` exists

### Requirement: Each earlier minor release has its own version
For each minor version other than the latest release's, the site SHALL publish that minor's highest patch tag at
`/docs/vMAJOR.MINOR/`. Other patch tags SHALL NOT be published as versions.

#### Scenario: Patches of an earlier minor
- **WHEN** troupe has tags `troupe-run-v0.1.0`, `troupe-run-v0.1.1` and `troupe-run-v0.2.0`
- **THEN** `/docs/v0.1/` shows the pages at `troupe-run-v0.1.1`, and no version is published from `troupe-run-v0.1.0`

#### Scenario: Patches of the latest minor
- **WHEN** troupe has tags `troupe-run-v0.2.0` and `troupe-run-v0.2.1`
- **THEN** `/docs/` shows `troupe-run-v0.2.1`, and no `/docs/v0.2/` exists

### Requirement: A malformed release tag stops the build
A tag that starts `troupe-run-v` but isn't `troupe-run-v` followed by three dot-separated whole numbers SHALL stop the
build, with an error naming the tag and the form that's accepted. Tags of troupe's other components, core's
`troupe-v*` among them, SHALL be ignored.

#### Scenario: A pre-release tag
- **WHEN** troupe has a tag `troupe-run-v1.0.0-rc.1`
- **THEN** the build fails, naming `troupe-run-v1.0.0-rc.1` and the accepted form `troupe-run-vMAJOR.MINOR.PATCH`

#### Scenario: Another component's tag
- **WHEN** troupe has a tag `protocol-v0.1.0`, `troupe-v0.1.0` or `troupe-runner-scripted-v0.1.0`
- **THEN** the build ignores it

#### Scenario: Core's malformed tag
- **WHEN** troupe has a tag `troupe-v1.0.0-rc.1`
- **THEN** the build ignores it, as another component's tag

### Requirement: Pages are edited in troupe, on next and the latest release only
On `/docs/next/` and on the latest release's pages, "Improve this page" SHALL open the page's source on troupe-run/troupe's
`main`, at `https://github.com/troupe-run/troupe/edit/main/docs/<path>`. Archived versions, and a page that no longer
exists on `main`, SHALL show no edit link, and SHALL link "View source" to the page at their version's tag instead
(owner, 2026-10-19).

#### Scenario: A page of the latest release
- **WHEN** a reader opens `/docs/the-company/theatres/`, which also exists on `main`
- **THEN** its "Improve this page" link is `https://github.com/troupe-run/troupe/edit/main/docs/the-company/theatres.md`

#### Scenario: A page of an archived version
- **WHEN** a reader opens a page under `/docs/v0.1/`
- **THEN** it has no "Improve this page" link, and if it's planned, its note has no "Help write this page" link
- **AND** its "View source" link is `https://github.com/troupe-run/troupe/blob/troupe-run-v0.1.1/docs/<path>` when
  v0.1 is built from `troupe-run-v0.1.1`

#### Scenario: A released page that was removed from main
- **WHEN** a reader opens a page of the latest release that `main` no longer has
- **THEN** it has no "Improve this page" link, and its "View source" link goes to the page at the latest release's tag

#### Scenario: A page that can be edited
- **WHEN** a reader opens a page of `next`
- **THEN** it has an "Improve this page" link and no "View source" link
