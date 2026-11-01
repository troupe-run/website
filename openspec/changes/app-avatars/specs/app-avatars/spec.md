# Spec Delta

## Purpose

Gives each GitHub App that acts for troupe-run an avatar in troupe's style, recorded in the brand guide and rendered
from a source in `brand/`, so whatever an App posts is recognisably troupe's and shows which job it does.

## ADDED Requirements

### Requirement: The brand guide records each App's character
The brand guide's §5 SHALL hold a subsection on the GitHub Apps. It SHALL give the shape rule (an App that runs a
fixed workflow is troupe acting by itself; an App that is an AI acting as an agent is an agent), and a table of each
App, its kind and its prop. §8's asset table SHALL list the App avatars.

#### Scenario: Reading the guide
- **WHEN** the brand guide is read
- **THEN** §5 lists `troupe-run-release`, `troupe-run-review`, `troupe-run-dependabot`, `troupe-run-infrastructure`,
  `troupe-run-docs`, `troupe-run-dispatch` and `troupe-run-board`, each with its kind and prop, and §8 has a row for
  the App avatars

#### Scenario: A third-party App
- **WHEN** the guide's App table is read
- **THEN** it doesn't list `dco`, which keeps its own icon

### Requirement: Each App's shape and colour follow its kind
An App of kind `system` SHALL be the tomato rounded triangle, and an App of kind agent SHALL be the teal rounded
square. Each SHALL have two round white eyes, no outline, shadow or gradient, and a prop in `--ink` or `--sunflower`
only. No other colour SHALL appear in an App's source.

#### Scenario: A source uses a colour outside its kind
- **WHEN** a `system` App's source fills a shape with teal, or any App's source uses a colour other than its head
  colour, white, ink or sunflower
- **THEN** the check fails, naming the App's source and the colour

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
