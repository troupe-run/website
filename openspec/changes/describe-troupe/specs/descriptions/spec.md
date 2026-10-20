# Spec Delta

## Purpose

Records how troupe is described in the brand guide, and holds every place on this site that describes troupe (the
hero, the landing page's title and description, and the README banner) to that record, so the wording can't drift.

## ADDED Requirements

### Requirement: The brand guide records how troupe is described
The brand guide's §7 SHALL hold a subsection, "How troupe is described", with a table of the tagline, sentence,
paragraph, status line, one-line description and page title, each with its text. It SHALL name the deliberate
variants and say that GitHub, troupe's README and this site follow it.

#### Scenario: The table is read
- **WHEN** the brand guide's "How troupe is described" table is read
- **THEN** its tagline is "Your agents need a director.", its sentence is "troupe runs your development process with
  a team of agents, asking only when it needs you.", its status line is "Pre-alpha: there's nothing to install yet."
  and its page title is "troupe: your agents need a director"

#### Scenario: A part is missing from the table
- **WHEN** a row of the six is removed or renamed
- **THEN** the check fails, naming the missing part

### Requirement: The set agrees with itself
The paragraph SHALL open with the sentence, and the one-line description SHALL be the tagline followed by the
sentence. The one-line description SHALL be no longer than 160 characters, GitHub's limit on an org's description.

#### Scenario: The sentence changes but the paragraph doesn't
- **WHEN** the sentence in the table is edited and the paragraph still opens with the old one
- **THEN** the check fails, naming the paragraph and the sentence it should open with

#### Scenario: The one-line description is too long
- **WHEN** the tagline and sentence together are longer than 160 characters
- **THEN** the check fails, giving the length and the limit

### Requirement: The hero uses the tagline and the paragraph
The landing page's hero SHALL show the tagline as its title and the paragraph as its subtitle, word for word.

#### Scenario: The built hero
- **WHEN** the landing page is loaded
- **THEN** its only h1 reads "Your agents need a director." and the line under it is the paragraph

#### Scenario: The hero copy drifts from the guide
- **WHEN** the hero's subtitle in the landing copy differs from the paragraph in the brand guide
- **THEN** the check fails, naming the hero's subtitle and the text it should have

### Requirement: The landing page's title and description use the set
The landing page's title and `og:title` SHALL be the page title. Its meta description and `og:description` SHALL be
the one-line description followed by the status line.

#### Scenario: The built page's metadata
- **WHEN** the landing page is loaded
- **THEN** its title and `og:title` are "troupe: your agents need a director", and its description and
  `og:description` are "Your agents need a director. troupe runs your development process with a team of agents,
  asking only when it needs you. Pre-alpha: there's nothing to install yet."

#### Scenario: The page's title drifts from the guide
- **WHEN** the landing page's title or description differs from the brand guide's set
- **THEN** the check fails, naming which one and the text it should have

### Requirement: The README banner uses the sentence
The README banner's line under the wordmark SHALL be the sentence, and the committed banner image SHALL be rendered
from that text.

#### Scenario: The banner's text drifts from the guide
- **WHEN** the banner template's line differs from the sentence in the brand guide
- **THEN** the check fails, naming the banner and the text it should have

#### Scenario: The template changes but the image isn't re-rendered
- **WHEN** the banner template is edited and its committed image isn't rendered again
- **THEN** asset verification fails, as it does for any brand image
