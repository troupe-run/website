# Spec Delta

## ADDED Requirements

### Requirement: An earlier build never keeps an old release list on the protocol page
Every build SHALL publish `/protocol/`'s list of protocol releases from the `protocol-v*` tags and page words it read,
even when it starts from an earlier build's cache and nothing in this repository has changed since.

#### Scenario: A new protocol tag, website unchanged
- **WHEN** a build runs on an earlier build's cache, with the same website commit, after troupe was tagged with a
  new `protocol-v*` release
- **THEN** `/protocol/` lists that release and names it as the latest
