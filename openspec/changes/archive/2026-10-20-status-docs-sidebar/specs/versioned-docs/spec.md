# Spec Delta

## MODIFIED Requirements

### Requirement: The sidebar links to the pages the website keeps
Every version's sidebar SHALL end its Programme section with a link to Status and roadmap at `/status/`, and its
Backstage section with a link to the org's CONTRIBUTING.md at
`https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md`.

#### Scenario: Finding the roadmap from the docs
- **WHEN** a reader opens the sidebar on any docs page
- **THEN** Programme ends with "Status and roadmap", linking to `/status/`

#### Scenario: Following the roadmap link keeps the docs sidebar
- **WHEN** a reader follows "Status and roadmap" from the docs sidebar
- **THEN** `/status/` shows the docs sidebar, with "Status and roadmap" marked as the current page

### Requirement: Status and roadmap is the site's own page at /status/
Status and roadmap SHALL be a page of this repository at `/status/`, outside `/docs` and in no version, with the site
header reading "troupe docs" and no version menu. It SHALL show the sidebar of the version at `/docs/`, with "Status
and roadmap" marked as the current page. `/docs/programme/status-and-roadmap/` SHALL redirect to `/status/`.

#### Scenario: The old URL
- **WHEN** a reader follows troupe's link to `https://troupe.run/docs/programme/status-and-roadmap/`
- **THEN** they arrive at `/status/`, with the docs sidebar

#### Scenario: The page itself
- **WHEN** a reader opens `/status/`
- **THEN** it shows Status and roadmap, with "troupe docs" in the header and "Status and roadmap | troupe docs" as the
  tab title, an "Improve this page" link to its source in troupe-run/website, and no version menu

#### Scenario: The sidebar on /status/
- **WHEN** a reader opens `/status/`
- **THEN** the sidebar lists the pages of the version at `/docs/` in the six sections, every docs link in it points
  to that version, and "Status and roadmap" is the only entry marked as the current page

#### Scenario: The sidebar on a narrow screen
- **WHEN** a reader opens `/status/` at 320px wide
- **THEN** the docs sidebar is reachable from the menu button, as it is on a docs page

#### Scenario: Before the first release and after it
- **WHEN** the site is built with troupe releases (the fixture build)
- **THEN** `/status/`'s sidebar links to the latest release's pages under `/docs/`, never to `/docs/next/` or an
  archived version

## ADDED Requirements

### Requirement: Only pages the docs sidebar links to show it outside /docs
A page outside `/docs` SHALL show the docs sidebar only when the docs sidebar links to it. Every other page outside
`/docs`, the blog's among them, SHALL show no left-hand sidebar.

#### Scenario: A blog page
- **WHEN** a reader opens `/blog/` or a blog post
- **THEN** it shows no left-hand sidebar

### Requirement: Pages outside /docs have no Previous or Next link into it
A page outside `/docs` SHALL have no "Previous" or "Next" link to a docs page. A blog post SHALL keep its links to
other blog posts.

#### Scenario: Status and roadmap
- **WHEN** a reader opens `/status/`
- **THEN** it has no "Previous" or "Next" link

#### Scenario: A blog post with no neighbouring post
- **WHEN** a reader opens the only blog post
- **THEN** it has no "Previous" or "Next" link to a page under `/docs`
