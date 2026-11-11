## ADDED Requirements

### Requirement: Links from troupe's main into troupe's repository lead somewhere
A link on a page read from troupe's `main` to `https://github.com/troupe-run/troupe/blob/<ref>/<path>` or
`/tree/<ref>/<path>` SHALL name a ref the site's troupe source has (`main`, a tag or a commit) and a path that exists at
that ref. Otherwise the build SHALL stop before writing any page, naming the version, each page and link, and the fix.
Links in code, and pages read from release tags, SHALL NOT be checked.

#### Scenario: A link to a changelog that isn't written yet
- **WHEN** a page on troupe's `main` links `https://github.com/troupe-run/troupe/blob/main/plugins/runner-ollama/CHANGELOG.md`, and `main` has no such file
- **THEN** the build fails, naming troupe's main, the page, the link, that `plugins/runner-ollama/CHANGELOG.md` doesn't exist at `main`, and saying to link it once it exists or to link a path that does

#### Scenario: A link to a file that exists
- **WHEN** a page on troupe's `main` links `https://github.com/troupe-run/troupe/blob/main/protocol/CHANGELOG.md`, and `main` has that file
- **THEN** the build succeeds and the link is left as written

#### Scenario: A link to a folder
- **WHEN** a page on troupe's `main` links `https://github.com/troupe-run/troupe/tree/main/plugins`, and `main` has that folder
- **THEN** the build succeeds

#### Scenario: A link with an anchor or a query
- **WHEN** a page on troupe's `main` links `https://github.com/troupe-run/troupe/blob/main/docs/README.md#layout`, and `main` has `docs/README.md`
- **THEN** the build succeeds: only the path is checked

#### Scenario: A link at a release tag
- **WHEN** a page on troupe's `main` links a path at a tag the source has, such as `blob/troupe-v0.1.0/packages/troupe/CHANGELOG.md`
- **THEN** the path is checked at that tag, not at `main`

#### Scenario: A link at a ref the source doesn't have
- **WHEN** a page on troupe's `main` links `https://github.com/troupe-run/troupe/blob/some-branch/README.md`
- **THEN** the build fails, naming the page, the link and `some-branch`, and saying to link `main`, a tag or a commit

#### Scenario: Every broken link is named at once
- **WHEN** two pages on troupe's `main` each link a path that doesn't exist
- **THEN** the build fails once, naming both pages and both links

#### Scenario: A link inside a code block
- **WHEN** a code block on a page on troupe's `main` shows `https://github.com/troupe-run/troupe/blob/main/missing.md`
- **THEN** the build doesn't check it, and the code block shows it unchanged

#### Scenario: A page from a release tag
- **WHEN** a page read from a release tag links `https://github.com/troupe-run/troupe/blob/main/gone.md`, and `main` has no such file
- **THEN** the build doesn't fail: a tag can't be changed, and the weekly external check reports the link

#### Scenario: A file added in a local checkout
- **WHEN** the docs are built from a local troupe checkout with `TROUPE_DOCS`, and a page links a file that is in its working tree but not yet committed
- **THEN** the build succeeds, as the working tree is `main`

#### Scenario: Other links to GitHub
- **WHEN** a page on troupe's `main` links an issue, a release or the repository's front page on github.com
- **THEN** the build doesn't check it, and the weekly external check does
