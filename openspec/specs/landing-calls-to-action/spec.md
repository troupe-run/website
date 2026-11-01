# landing-calls-to-action Specification

## Purpose

Holds the landing page's calls to action to what they say and where they go, so a visitor can act on them and the
page never offers something that isn't there.

## Requirements

### Requirement: The hero links to the install page
The hero's secondary call to action SHALL be a link labelled "Install (pre-alpha)" to the install page,
`/docs/opening-night/install/`. It SHALL be enabled, reachable by keyboard and styled as a secondary button, not as a
disabled one. The label is the landing page's visible pre-alpha signal, as the brand guide's §7 records.

#### Scenario: The built hero
- **WHEN** the landing page is loaded
- **THEN** the hero has a link named "Install (pre-alpha)" whose `href` is `/docs/opening-night/install/`, and no
  disabled button

#### Scenario: Following the link
- **WHEN** the "Install (pre-alpha)" link is followed
- **THEN** the install page loads, with the heading "Install"

#### Scenario: Reaching it by keyboard
- **WHEN** a keyboard user tabs through the hero
- **THEN** focus reaches "Watch on GitHub", then "Install (pre-alpha)", and the focused link shows the site's focus
  outline

### Requirement: The hero's copy gives the install link a path on this site
The hero's copy SHALL give its secondary call to action a label and a link, and the link SHALL be a path on this site,
starting with `/`. A secondary call to action with no link, or with a link that isn't such a path, SHALL fail the
build, naming the hero's copy.

#### Scenario: The link is missing
- **WHEN** the hero's copy gives the secondary call to action a label and no link
- **THEN** the build fails, naming the hero's copy and the missing link

#### Scenario: The link goes off the site
- **WHEN** the hero's copy gives the secondary call to action a full URL, such as `https://example.com/install`
- **THEN** the build fails, naming the hero's copy and saying the link must be a path on this site
