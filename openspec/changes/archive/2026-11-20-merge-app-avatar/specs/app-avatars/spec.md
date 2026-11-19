## MODIFIED Requirements

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
