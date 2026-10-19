# Spec Delta

## Purpose

How troupe.run's `/docs` is built from troupe-run/troupe's `docs/`, one version per release: which versions exist and
at which URLs, the page contract the site accepts, how readers move between versions, and which pages stay with the
website.

## ADDED Requirements

### Requirement: Every docs page comes from troupe-run/troupe
The site SHALL build every page under `/docs` from troupe-run/troupe's `docs/` folder, at the ref of the version it
belongs to. A page at `docs/<section>/<name>.md` SHALL publish at `/docs/<version prefix><section>/<name>/`. This
repository SHALL hold no `/docs` page content of its own.

#### Scenario: A page on troupe's main before any release
- **WHEN** troupe has no `troupe-v*` tag and its `main` has `docs/the-company/theatres.md`
- **THEN** the site publishes it at `/docs/the-company/theatres/`, rendered in the site's design

#### Scenario: An edit in troupe reaches the site
- **WHEN** a push to troupe's `main` changes a page's text, and the site is rebuilt
- **THEN** the page on the site shows the new text, with no change in this repository

#### Scenario: No docs content is kept here
- **WHEN** this repository's tracked files are listed
- **THEN** none is a page under `src/content/docs/docs/`

### Requirement: The latest release is at /docs/
When troupe has at least one release tag `troupe-vMAJOR.MINOR.PATCH`, `/docs/` SHALL show the docs at the highest such
tag. Before the first release, `/docs/` SHALL show troupe's `main`.

#### Scenario: Two releases
- **WHEN** troupe has tags `troupe-v0.1.1` and `troupe-v0.2.0`
- **THEN** `/docs/` shows the pages at `troupe-v0.2.0`

#### Scenario: No release yet
- **WHEN** troupe has no `troupe-v*` tag
- **THEN** `/docs/` shows the pages on `main`, and no `/docs/next/` exists

### Requirement: Each earlier minor release has its own version
For each minor version other than the latest release's, the site SHALL publish that minor's highest patch tag at
`/docs/vMAJOR.MINOR/`. Other patch tags SHALL NOT be published as versions.

#### Scenario: Patches of an earlier minor
- **WHEN** troupe has tags `troupe-v0.1.0`, `troupe-v0.1.1` and `troupe-v0.2.0`
- **THEN** `/docs/v0.1/` shows the pages at `troupe-v0.1.1`, and no version is published from `troupe-v0.1.0`

#### Scenario: Patches of the latest minor
- **WHEN** troupe has tags `troupe-v0.2.0` and `troupe-v0.2.1`
- **THEN** `/docs/` shows `troupe-v0.2.1`, and no `/docs/v0.2/` exists

### Requirement: troupe's main is at /docs/next/ once a release exists
When troupe has at least one release tag, the site SHALL publish troupe's `main` at `/docs/next/`, and every page there
SHALL say that it describes unreleased docs, ahead of the latest release, with a link to the latest release.

#### Scenario: A page in next
- **WHEN** a reader opens `/docs/next/the-company/theatres/` and the latest release is v0.2
- **THEN** the page says it describes troupe's unreleased `main`, ahead of v0.2, and links to the same page in the
  latest release

### Requirement: An archived version says it isn't the latest
Every page of an archived version (`/docs/vX.Y/`) SHALL say which version it describes and which version is the latest,
and link to the same page in the latest release, or to the latest release's first page when that page doesn't exist
there.

#### Scenario: A page that still exists
- **WHEN** a reader opens `/docs/v0.1/the-company/theatres/` and the latest release is v0.2, which has that page
- **THEN** the page says it describes v0.1, that the latest release is v0.2, and links to `/docs/the-company/theatres/`

#### Scenario: A page that was removed
- **WHEN** a reader opens an archived page that the latest release doesn't have
- **THEN** the link to the latest release goes to its first page

### Requirement: A malformed release tag stops the build
A tag that starts `troupe-v` but isn't `troupe-v` followed by three dot-separated whole numbers SHALL stop the build,
with an error naming the tag and the form that's accepted. Tags of troupe's other components SHALL be ignored.

#### Scenario: A pre-release tag
- **WHEN** troupe has a tag `troupe-v1.0.0-rc.1`
- **THEN** the build fails, naming `troupe-v1.0.0-rc.1` and the accepted form `troupe-vMAJOR.MINOR.PATCH`

#### Scenario: Another component's tag
- **WHEN** troupe has a tag `protocol-v0.1.0`
- **THEN** the build ignores it

### Requirement: Every docs page has a version menu
Every docs page SHALL have a version menu that names the version being read and lists every published version, newest
first, with the latest release marked "latest" and `next` marked "unreleased". Before the first release, it SHALL list
one version, marked "unreleased". The menu SHALL work without JavaScript and from the keyboard.

#### Scenario: Reading an archived page
- **WHEN** a reader opens a page in `/docs/v0.1/` and versions v0.2, next and v0.1 exist
- **THEN** the menu says v0.1 is being read, and lists next (unreleased), v0.2 (latest) and v0.1

#### Scenario: Before the first release
- **WHEN** troupe has no release and a reader opens any docs page
- **THEN** the menu lists one version, marked unreleased

#### Scenario: With the keyboard
- **WHEN** a keyboard user tabs to the menu, opens it and follows an entry
- **THEN** they reach that version without using a pointer

### Requirement: The menu keeps the reader on the same page
Each entry in the version menu SHALL link to the same page in that version when the version has it, and to that
version's first page when it doesn't.

#### Scenario: A page every version has
- **WHEN** a reader on `/docs/v0.1/the-company/theatres/` follows the menu's "v0.2 (latest)" entry
- **THEN** they arrive at `/docs/the-company/theatres/`

#### Scenario: A page added in a later version
- **WHEN** a reader on a page that v0.1 doesn't have follows the menu's v0.1 entry
- **THEN** they arrive at v0.1's first page

### Requirement: Each version's sidebar lists that version's pages
The sidebar on a docs page SHALL list the pages of that page's version, in the six sections in the site's order
(Programme, Opening night, The company, Stagecraft, Prompt book, Backstage), and every link in it SHALL stay in that
version. The page order within each section is the website's. A page the order doesn't name SHALL still be listed,
after the named pages. "Next" and "Previous" links SHALL stay in the version too.

#### Scenario: A page troupe added
- **WHEN** troupe adds `docs/stagecraft/new-guide.md`, which the website's order doesn't name
- **THEN** the sidebar lists it at the end of Stagecraft, and the build doesn't fail

#### Scenario: A page an older version lacks
- **WHEN** a reader opens a v0.1 page and v0.1 has no `stagecraft/new-guide.md`
- **THEN** v0.1's sidebar doesn't list it, and every sidebar link points under `/docs/v0.1/`

### Requirement: The sidebar links to the pages the website keeps
Every version's sidebar SHALL end its Programme section with a link to Status and roadmap at `/status/`, and its
Backstage section with a link to the org's CONTRIBUTING.md at
`https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md`.

#### Scenario: Finding the roadmap from the docs
- **WHEN** a reader opens the sidebar on any docs page
- **THEN** Programme ends with "Status and roadmap", linking to `/status/`

### Requirement: Each version's root redirects to its first page
`/docs/`, `/docs/next/` and each `/docs/vX.Y/` SHALL redirect to their version's first page.

#### Scenario: Opening an archived version
- **WHEN** a reader opens `/docs/v0.1/`
- **THEN** they're redirected to `/docs/v0.1/programme/what-is-troupe/`, when v0.1 has that page

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
- **AND** its "View source" link is `https://github.com/troupe-run/troupe/blob/troupe-v0.1.1/docs/<path>` when v0.1 is
  built from `troupe-v0.1.1`

#### Scenario: A released page that was removed from main
- **WHEN** a reader opens a page of the latest release that `main` no longer has
- **THEN** it has no "Improve this page" link, and its "View source" link goes to the page at the latest release's tag

#### Scenario: A page that can be edited
- **WHEN** a reader opens a page of `next`
- **THEN** it has an "Improve this page" link and no "View source" link

### Requirement: "Last updated" is troupe's date for the page
A docs page's "Last updated" date SHALL be the date of the newest commit in troupe-run/troupe that changed that page,
at the version's ref.

#### Scenario: A page last changed in troupe
- **WHEN** troupe's newest commit touching `docs/programme/what-is-troupe.md` at the version's ref is dated 2026-10-19
- **THEN** that page shows "Last updated" with 2026-10-19

### Requirement: Search finds the current version only
The site's search SHALL index the pages at `/docs/` and SHALL NOT index the pages of `next` or of archived versions.

#### Scenario: Searching for a page title
- **WHEN** a reader searches for "Theatres" and versions next and v0.1 exist
- **THEN** the results link only to `/docs/the-company/theatres/`, not to its `next` or v0.1 copies

### Requirement: The site accepts exactly troupe's page contract
A page's front matter SHALL be read as troupe's docs check reads it, with exactly the keys it allows: `title`,
`description`, `status`, `prerelease` and `purpose`. A page troupe's check would refuse SHALL stop the build, naming the
version, the page and the fix.

#### Scenario: An unknown key
- **WHEN** a page at a version's ref has `staus: written` in its front matter
- **THEN** the build fails, naming the version, the page, `staus` and the keys that are allowed

#### Scenario: troupe allows a new key
- **WHEN** troupe's docs check adds a key to the keys it allows, and the site doesn't
- **THEN** the site's tests fail, naming the key

#### Scenario: A value YAML would read differently
- **WHEN** a page's description is `yes`, unquoted
- **THEN** the build fails, naming the page and `description`, and saying to quote the value

### Requirement: Only Markdown pages in the six sections are accepted
Every file under a version's `docs/` SHALL be a `.md` page directly inside one of `programme/`, `opening-night/`,
`the-company/`, `stagecraft/`, `prompt-book/` or `backstage/`. Any other file SHALL stop the build, naming the version
and the path.

#### Scenario: An MDX page
- **WHEN** a version's `docs/` has `stagecraft/demo.mdx`
- **THEN** the build fails, naming the version and `docs/stagecraft/demo.mdx`, and saying only `.md` pages are accepted

#### Scenario: A seventh section
- **WHEN** a version's `docs/` has `appendix/notes.md`
- **THEN** the build fails, naming the path and the six sections

### Requirement: Links between pages work on the site
A relative link from one docs page to another (`../stagecraft/build-a-flow.md`, `cli.md#errors`) SHALL lead to that page
in the same version, keeping its anchor. Links in code examples SHALL be left as written. A relative link that leaves
`docs/` or doesn't name a `.md` page SHALL stop the build, naming the page and the link.

#### Scenario: A link in an archived version
- **WHEN** v0.1's `the-company/flows.md` links `../stagecraft/build-a-flow.md`
- **THEN** on `/docs/v0.1/the-company/flows/` the link goes to `/docs/v0.1/stagecraft/build-a-flow/`

#### Scenario: A link with an anchor
- **WHEN** a page links `cli.md#errors`
- **THEN** the link goes to that version's CLI page, at the heading `errors`

#### Scenario: A link inside a code block
- **WHEN** a code block shows `[x](other.md)`
- **THEN** the code block shows it unchanged

### Requirement: A fetch failure stops the build
When the site can't read troupe-run/troupe, the build SHALL fail, naming the source and the error, and saying how to
build from a local checkout. It SHALL NOT build from a copy fetched earlier.

#### Scenario: Offline
- **WHEN** the build runs with no network and no local checkout named
- **THEN** it fails, naming troupe-run/troupe and the git error, and saying to set `TROUPE_DOCS` to a local checkout

### Requirement: The docs can be built from a local troupe checkout
When `TROUPE_DOCS` names a directory, the site SHALL take troupe's `main` from that checkout's working tree, including
uncommitted edits, and the release tags from that checkout. A `TROUPE_DOCS` that's set but empty, or isn't a git working
tree with a `docs/` folder, SHALL stop the build, naming the variable and its value.

#### Scenario: Previewing an unpushed edit
- **WHEN** a writer edits a page in their troupe checkout and runs the site with `TROUPE_DOCS` set to it
- **THEN** the page shows the edit

#### Scenario: A wrong path
- **WHEN** `TROUPE_DOCS` is set to a folder with no `docs/`
- **THEN** the build fails, naming `TROUPE_DOCS`, the path and what it must contain

### Requirement: Status and roadmap is the site's own page at /status/
Status and roadmap SHALL be a page of this repository at `/status/`, outside `/docs` and in no version, with the site
header and no docs sidebar or version menu. `/docs/programme/status-and-roadmap/` SHALL redirect to `/status/`.

#### Scenario: The old URL
- **WHEN** a reader follows troupe's link to `https://troupe.run/docs/programme/status-and-roadmap/`
- **THEN** they arrive at `/status/`

#### Scenario: The page itself
- **WHEN** a reader opens `/status/`
- **THEN** it shows Status and roadmap, with an "Improve this page" link to its source in troupe-run/website, and no
  version menu

### Requirement: Contributing is the org's guide
The docs SHALL NOT have a Contributing page of their own. `/docs/backstage/contributing/` SHALL redirect to
`https://github.com/troupe-run/.github/blob/main/CONTRIBUTING.md`.

#### Scenario: The old URL
- **WHEN** a reader opens `/docs/backstage/contributing/`
- **THEN** they arrive at the org's CONTRIBUTING.md
