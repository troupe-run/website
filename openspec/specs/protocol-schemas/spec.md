# protocol-schemas Specification

## Purpose

How troupe.run serves troupe's protocol schemas under `/protocol/`, built from troupe-run/troupe's `protocol/schemas/`
and versioned by its `protocol-v*` tags: which copies exist at which paths, how each copy's ids name its own URLs,
what stops the build, and the page that says which path to use.

## Requirements

### Requirement: Every schema comes from troupe-run/troupe
The site SHALL build every file under `/protocol/` from troupe-run/troupe's `protocol/schemas/`, at the ref of the copy
it belongs to, from the same source as `/docs` (the fetched repository, or the checkout `TROUPE_DOCS` names). A schema
at `protocol/schemas/<path>` SHALL publish at `/protocol/<copy prefix><path>`. This repository SHALL hold no schema.

#### Scenario: A schema on troupe's main
- **WHEN** troupe has no `protocol-v*` tag and its `main` has `protocol/schemas/config/actor.schema.json`
- **THEN** the site publishes it at `/protocol/config/actor.schema.json`

#### Scenario: Previewing an unpushed schema edit
- **WHEN** a writer edits a schema in their troupe checkout and builds the site with `TROUPE_DOCS` set to it
- **THEN** `/protocol/next/` serves the edited schema

#### Scenario: No schema is kept here
- **WHEN** this repository's tracked files are listed
- **THEN** none is a file under `public/protocol/`

### Requirement: The latest release is at /protocol/
When troupe has at least one tag `protocol-vMAJOR.MINOR.PATCH`, `/protocol/<path>` SHALL serve the schemas at the
highest such tag, by semver. Before the first protocol release, it SHALL serve troupe's `main`.

#### Scenario: Two releases
- **WHEN** troupe has tags `protocol-v0.2.1` and `protocol-v0.10.0`
- **THEN** `/protocol/error.schema.json` is the file at `protocol-v0.10.0`

#### Scenario: No release yet
- **WHEN** troupe has no `protocol-v*` tag
- **THEN** `/protocol/error.schema.json` is the file on `main`

### Requirement: Each major version has a copy
For each major version among troupe's protocol tags, the site SHALL publish the highest release with that major at
`/protocol/<major>/`. Before the first protocol release, `/protocol/0/` SHALL serve troupe's `main`, so that the URL
troupe writes into the files it creates resolves.

#### Scenario: Releases of two majors
- **WHEN** troupe has tags `protocol-v0.3.0`, `protocol-v0.4.2` and `protocol-v1.0.0`
- **THEN** `/protocol/0/` serves `protocol-v0.4.2`, and `/protocol/1/` serves `protocol-v1.0.0`

#### Scenario: Before the first release
- **WHEN** troupe has no `protocol-v*` tag
- **THEN** `/protocol/0/config/actor.schema.json` is the file on `main`, and no other major version has a copy

### Requirement: troupe's main is at /protocol/next/
The site SHALL always publish troupe's `main` at `/protocol/next/`, whether or not a protocol release exists.

#### Scenario: Trying an unreleased change
- **WHEN** a push to troupe's `main` changes `protocol/schemas/lineage.schema.json`, and the site is rebuilt
- **THEN** `/protocol/next/lineage.schema.json` shows the change, and `/protocol/lineage.schema.json` doesn't once a
  release exists

### Requirement: Each protocol tag has its own copy
For each `protocol-vMAJOR.MINOR.PATCH` tag, the site SHALL publish the schemas at that tag at
`/protocol/MAJOR.MINOR.PATCH/`. The copies SHALL be the tags that exist when the site is built: a deleted tag's copy
SHALL be gone after the next build, and a recreated tag's copy SHALL be rebuilt from the tag as it now is.

#### Scenario: Pinning a release
- **WHEN** troupe has tags `protocol-v0.2.0` and `protocol-v0.2.1`
- **THEN** `/protocol/0.2.0/` and `/protocol/0.2.1/` each serve their own tag's schemas

#### Scenario: A deleted tag
- **WHEN** `protocol-v0.2.1` is deleted in troupe and the site is rebuilt
- **THEN** nothing is served under `/protocol/0.2.1/`

### Requirement: A malformed protocol tag stops the build
A tag that starts `protocol-v` but isn't `protocol-v` followed by three dot-separated whole numbers with no leading
zeros SHALL stop the build, with an error naming the tag and the accepted form. Tags of troupe's other components SHALL
be ignored.

#### Scenario: A pre-release tag
- **WHEN** troupe has a tag `protocol-v1.0.0-rc.1`
- **THEN** the build fails, naming `protocol-v1.0.0-rc.1` and the accepted form `protocol-vMAJOR.MINOR.PATCH`

#### Scenario: Another component's tag
- **WHEN** troupe has a tag `troupe-v0.1.0`
- **THEN** `/protocol/` gets no copy from it

### Requirement: Each copy's ids are its own URLs
In every copy but the latest, each schema's `$id`, and each `$ref` or `$dynamicRef` that is an absolute URL under
`https://troupe.run/protocol/`, SHALL be rewritten from troupe's unversioned URL to the same path under that copy.
Relative references SHALL be left as written. Apart from those values, every published schema SHALL be the same JSON as
troupe's file.

#### Scenario: A major-version copy
- **WHEN** `/protocol/0/runner/run-start.schema.json` is read
- **THEN** its `$id` is `https://troupe.run/protocol/0/runner/run-start.schema.json`

#### Scenario: An absolute reference between troupe's schemas
- **WHEN** a schema at a tag has `"$ref": "https://troupe.run/protocol/lineage.schema.json#/$defs/hash"`
- **THEN** in `/protocol/next/` that reference reads `https://troupe.run/protocol/next/lineage.schema.json#/$defs/hash`

#### Scenario: The latest copy
- **WHEN** `/protocol/runner/run-start.schema.json` is read
- **THEN** its `$id` is troupe's unversioned `https://troupe.run/protocol/runner/run-start.schema.json`

#### Scenario: Text that mentions a URL
- **WHEN** a schema's `description` contains `https://troupe.run/protocol/0/config/actor.schema.json`
- **THEN** every copy publishes that description unchanged

### Requirement: A schema whose id isn't its own URL stops the build
Each schema's `$id` SHALL be `https://troupe.run/protocol/<path>`, where `<path>` is the file's path under
`protocol/schemas/`. A schema with no `$id`, or another one, SHALL stop the build, naming the ref, the file, the `$id`
found and the one expected.

#### Scenario: An id copied from another file
- **WHEN** `protocol/schemas/runner/shutdown.schema.json` at `main` has the `$id` of `run-cancel.schema.json`
- **THEN** the build fails, naming `main`, `runner/shutdown.schema.json`, the id found and
  `https://troupe.run/protocol/runner/shutdown.schema.json`

### Requirement: An absolute reference must stay in its copy
An absolute `$ref` or `$dynamicRef` under `https://troupe.run/protocol/` SHALL be troupe's unversioned URL of a schema
in the same ref's `protocol/schemas/`. Any other, such as one naming a major version or a file that doesn't exist, SHALL
stop the build, naming the ref, the file and the reference.

#### Scenario: A reference pinned to a major version
- **WHEN** a schema has `"$ref": "https://troupe.run/protocol/0/lineage.schema.json"`
- **THEN** the build fails, naming the file and the reference, and saying to use
  `https://troupe.run/protocol/lineage.schema.json` or a relative reference

### Requirement: Only JSON Schema files are accepted
Every file under a ref's `protocol/schemas/` SHALL be named `*.schema.json` and SHALL parse as a JSON object. Any other
file SHALL stop the build, naming the ref and the path.

#### Scenario: A README among the schemas
- **WHEN** `protocol/schemas/runner/README.md` exists at `main`
- **THEN** the build fails, naming `main` and `protocol/schemas/runner/README.md`, and saying only `.schema.json` files
  are accepted

#### Scenario: A file that isn't JSON
- **WHEN** a `.schema.json` file at a tag has a trailing comma
- **THEN** the build fails, naming the tag, the file and the JSON error

### Requirement: A schema folder can't take a copy's name
A folder directly under `protocol/schemas/` named `next`, a whole number or `MAJOR.MINOR.PATCH` SHALL stop the build,
naming the ref and the folder, since its files would be served at another copy's URLs.

#### Scenario: A folder named next
- **WHEN** `protocol/schemas/next/thing.schema.json` exists at `main`
- **THEN** the build fails, naming `main` and `protocol/schemas/next/`, and nothing is published

### Requirement: Every reference in every copy resolves
The check SHALL resolve every `$ref` and `$dynamicRef` in every published schema against that schema's URL, and SHALL
fail when one names no published file, or a fragment the file doesn't have: a JSON Pointer that leads nowhere, or an
anchor no `$anchor` or `$dynamicAnchor` declares. It SHALL name the file, the reference and why.

#### Scenario: A pointer to a definition that was removed
- **WHEN** a copy's `client/status-result.schema.json` refers to `run.schema.json#/$defs/summary`, and that copy's
  `run.schema.json` has no `summary` in its `$defs`
- **THEN** the check fails, naming `client/status-result.schema.json`, the reference, and that `/$defs/summary` isn't
  in `run.schema.json`

#### Scenario: A reference to the JSON Schema meta-schema
- **WHEN** a schema refers to a URL outside `https://troupe.run/protocol/`
- **THEN** the check leaves it alone

### Requirement: Schemas are served as JSON
Every published schema SHALL be a `.json` file, served with the content type `application/json`.

#### Scenario: An editor fetching a schema
- **WHEN** a client requests `https://troupe.run/protocol/0/config/actor.schema.json`
- **THEN** the response is the schema, with `Content-Type: application/json`

### Requirement: The protocol page says which path to use when
`/protocol/` SHALL be a page of this repository saying which of the four kinds of path to use when, listing the
protocol releases the site publishes (or that there are none yet), and linking to troupe's protocol README for what
each schema defines. It SHALL show no docs sidebar and no version menu.

#### Scenario: Before the first protocol release
- **WHEN** a reader opens `/protocol/` and troupe has no `protocol-v*` tag
- **THEN** the page explains the four paths, says no protocol release exists yet and that `/protocol/` and
  `/protocol/0/` serve troupe's `main` until one does, and has no left-hand sidebar

#### Scenario: With releases
- **WHEN** the site is built with tags `protocol-v0.1.0` and `protocol-v0.2.0`
- **THEN** the page lists 0.2.0 and 0.1.0, newest first, and names 0.2.0 as the latest

### Requirement: An earlier build never keeps an old release list on the protocol page
Every build SHALL publish `/protocol/`'s list of protocol releases from the `protocol-v*` tags and page words it read,
even when it starts from an earlier build's cache and nothing in this repository has changed since.

#### Scenario: A new protocol tag, website unchanged
- **WHEN** a build runs on an earlier build's cache, with the same website commit, after troupe was tagged with a
  new `protocol-v*` release
- **THEN** `/protocol/` lists that release and names it as the latest
