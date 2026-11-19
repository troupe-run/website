# app-avatars Specification

## Purpose

Gives each GitHub App that acts for troupe-run an avatar in troupe's style, recorded in the brand guide and rendered
from a source in `brand/`, so whatever an App posts is recognisably troupe's and shows which job it does.

## Requirements

### Requirement: The brand guide records each App's character
The brand guide's §5 SHALL hold a subsection on the GitHub Apps. It SHALL give the shape rule (an App that runs a
fixed workflow is troupe acting by itself; an App that is an AI acting as an agent is an agent), record each
exception to it with its reason, and hold a table of each App, its kind, its head and its prop. §8's asset table
SHALL list the App avatars.

#### Scenario: Reading the guide
- **WHEN** the brand guide is read
- **THEN** §5 lists `troupe-run-release`, `troupe-run-review`, `troupe-run-dependabot`, `troupe-run-infrastructure`,
  `troupe-run-docs`, `troupe-run-dispatch`, `troupe-run-board`, `troupe-run-test-quality` and `troupe-run-merge`,
  each with its kind, head and prop, and §8 has a row for the App avatars

#### Scenario: The test-quality App's exception
- **WHEN** the guide's "GitHub Apps" subsection is read
- **THEN** it lists `troupe-run-test-quality` as kind `system` with the `bug` head, and says why: the bug says what
  the App hunts for, and teal still means an agent everywhere else

#### Scenario: A third-party App
- **WHEN** the guide's App table is read
- **THEN** it doesn't list `dco`, which keeps its own icon

#### Scenario: A head the check doesn't know
- **WHEN** a row of the guide's App table gives a head other than `triangle`, `square` or `bug`
- **THEN** the check fails, naming the App and the head, and lists the heads it knows

#### Scenario: A head on a kind it isn't for
- **WHEN** a row gives the `square` head to a `system` App, or the `triangle` or `bug` head to an agent App
- **THEN** the check fails, naming the App, its kind and its head

### Requirement: Each App's shape and colour follow its kind
An App's head SHALL follow its kind (a tomato triangle for `system`, a teal square for an agent), except the
teal `bug` head the guide records for `troupe-run-test-quality`, a `system` App. Each App SHALL have two round white
eyes, no outline, shadow or gradient, and a prop: `--ink` lines on a `--sunflower` disc in a cream ring. A source
SHALL use no colour but its head's, white, ink, sunflower and cream. Where cream goes, and whether a shape reads as its
head, are judged in the owner's review.

#### Scenario: A source uses a colour outside its kind
- **WHEN** a `triangle` App's source fills a shape with teal, a `square` or `bug` App's source fills one with
  tomato, or any App's source uses a colour other than its head colour, white, ink, sunflower or cream
- **THEN** the check fails, naming the App's source and the colour

#### Scenario: The teal bug on a system App
- **WHEN** `troupe-run-test-quality`'s source draws its head in teal
- **THEN** the check passes it, because its head is `bug`, not because its kind is `system`

#### Scenario: A source has a gradient or a stroke of its own colour
- **WHEN** an App's source has a gradient, or a stroke in a colour other than the shape it outlines
- **THEN** the check fails, naming the App's source

#### Scenario: A colour the check can't read
- **WHEN** an App's source gives a colour in any form but a six-digit hex (`rgb()`, a named colour, a `style`
  attribute)
- **THEN** the check fails, naming the source and the value, and doesn't treat the colour as allowed

### Requirement: Every App in the guide has a source and an avatar, and nothing else does
Each App in the guide's table SHALL have a source SVG in `brand/` and a committed 500×500 PNG rendered from it.
There SHALL be no source or avatar for an App the guide doesn't list.

#### Scenario: An App is added to the guide without an avatar
- **WHEN** the guide's table lists an App that has no source or no render entry
- **THEN** the check fails, naming the App and what's missing

#### Scenario: An avatar is left over for an App the guide doesn't list
- **WHEN** a source or render entry exists for an App not in the guide's table
- **THEN** the check fails, naming it

### Requirement: The committed avatars are rendered from their sources
Each App avatar SHALL be rendered by the brand pipeline and committed, and asset verification SHALL cover it as it
covers every brand image.

#### Scenario: A source changes but the avatar isn't re-rendered
- **WHEN** an App's source SVG or the avatar template is edited and the avatars aren't rendered again
- **THEN** asset verification fails, naming the changed file

#### Scenario: An avatar is the wrong size
- **WHEN** a committed App avatar isn't 500×500
- **THEN** asset verification fails, naming the file and its size

### Requirement: The avatars read at GitHub's sizes
Each avatar SHALL read as its shape and kind at 20px, and its prop SHALL be recognisable at 40px and above. The prop
MAY become indistinct at 20px. This can't be judged by a test: the owner reviews the avatars at 20, 40 and 500px
before the change is done.

#### Scenario: The owner's review
- **WHEN** the avatars are shown to the owner at 20px, 40px and 500px, on light and dark backgrounds
- **THEN** the owner agrees that each reads as its kind at 20px and shows its prop at 40px, or the props are redrawn
