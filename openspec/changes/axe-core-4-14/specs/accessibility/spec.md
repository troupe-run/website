# Spec Delta

## Purpose

The site's automated accessibility gate. axe checks the site's pages against WCAG 2.2 AA in light and dark, and the
few findings the site accepts are each narrow, explained and checked.

## ADDED Requirements

### Requirement: axe finds no serious or critical violation
CI's end-to-end tests SHALL run axe, with the WCAG 2.0, 2.1 and 2.2 A and AA rule tags, in light and dark, on the
landing page, a written docs page, the licensing page, the glossary, the CLI reference, `/status/`, `/protocol/`, the
blog index, a blog post, and an archived and a next docs page with the version menu open. A serious or critical
violation that isn't an accepted finding SHALL fail the test, naming the rule and the node.

#### Scenario: A new violation
- **WHEN** a change gives a button on a docs page no accessible name
- **THEN** that page's axe tests fail in light and dark, naming `button-name` and the button

#### Scenario: A minor violation
- **WHEN** axe reports a violation of minor or moderate impact
- **THEN** the axe tests don't fail on it

### Requirement: An accepted axe finding names one rule on one node and says why
The site SHALL keep a single list of accepted axe findings, used by every axe test. Each entry SHALL name one rule,
one node's selector and the reason, with a link to where it was decided. An accepted finding SHALL excuse only that
rule on that node. Every other rule SHALL still check the node, and the rule SHALL still check every other node.

#### Scenario: The same rule on another node
- **WHEN** a page has another control whose visible text isn't part of its accessible name
- **THEN** the axe tests fail, naming `label-content-name-mismatch` and that control

#### Scenario: Another rule on the excepted node
- **WHEN** the search button loses its accessible name altogether
- **THEN** the axe tests fail, naming the rule that reports it

#### Scenario: The node's selector changes
- **WHEN** the search button no longer matches `button[data-open-modal=""]` and still breaks the rule
- **THEN** the axe tests fail, naming `label-content-name-mismatch` and its new selector

#### Scenario: An axe test that bypasses the list
- **WHEN** a file under `tests/e2e/` runs axe itself, without going through the shared helper that applies the list
- **THEN** the unit tests fail and name that file

### Requirement: The search button's accepted finding holds only while its reason does
The list SHALL accept `label-content-name-mismatch` on Starlight's search button (withastro/starlight#4260): its
visible text beyond its label is a keyboard-shortcut hint, also exposed through `aria-keyshortcuts`. A test SHALL
check, on a docs page at desktop width, that this is still true, and SHALL fail when it isn't.

#### Scenario: The reason holds
- **WHEN** the search button's accessible name is "Search", its visible text without the shortcut hint is "Search",
  and it has `aria-keyshortcuts`
- **THEN** the test passes

#### Scenario: The visible label changes
- **WHEN** the search button's visible text, without the shortcut hint, becomes anything other than its accessible
  name
- **THEN** the test fails, naming both texts

#### Scenario: The hint isn't exposed
- **WHEN** the search button has no `aria-keyshortcuts`
- **THEN** the test fails, saying the hint is conveyed only visually

### Requirement: An accepted finding that axe no longer reports fails
For each accepted finding, a test SHALL run its rule where the finding was seen and SHALL fail when axe no longer
reports it on its node, saying the entry can be removed, so the list holds only findings that still occur.

#### Scenario: Starlight or axe stops reporting the search button
- **WHEN** a Starlight or axe update makes `label-content-name-mismatch` pass on the search button
- **THEN** the test fails, saying the accepted finding for `button[data-open-modal=""]` is no longer reported and
  can be removed
