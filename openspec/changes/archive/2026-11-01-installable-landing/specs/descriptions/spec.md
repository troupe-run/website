# Spec Delta

## MODIFIED Requirements

### Requirement: The brand guide records how troupe is described
The brand guide's §7 SHALL hold a subsection, "How troupe is described", with a table of the tagline, sentence,
paragraph, status line, one-line description and page title, each with its text. It SHALL name the deliberate
variants and say that GitHub, troupe's README and this site follow it.

#### Scenario: The table is read
- **WHEN** the brand guide's "How troupe is described" table is read
- **THEN** its tagline is "Your agents need a director.", its sentence is "troupe runs your development process with
  a team of agents, asking only when it needs you.", its status line is "Pre-alpha: you can install it with uv." and
  its page title is "troupe: your agents need a director"

#### Scenario: A part is missing from the table
- **WHEN** a row of the six is removed or renamed
- **THEN** the check fails, naming the missing part

#### Scenario: The deliberate variants are read
- **WHEN** the deliberate variants under the table are read
- **THEN** they name the hero's "Install (pre-alpha)" link as the landing page's pre-alpha signal, and no longer name
  "Install: coming"

### Requirement: The landing page's title and description use the set
The landing page's title and `og:title` SHALL be the page title. Its meta description and `og:description` SHALL be
the one-line description followed by the status line.

#### Scenario: The built page's metadata
- **WHEN** the landing page is loaded
- **THEN** its title and `og:title` are "troupe: your agents need a director", and its description and
  `og:description` are "Your agents need a director. troupe runs your development process with a team of agents,
  asking only when it needs you. Pre-alpha: you can install it with uv."

#### Scenario: The page's title drifts from the guide
- **WHEN** the landing page's title or description differs from the brand guide's set
- **THEN** the check fails, naming which one and the text it should have
