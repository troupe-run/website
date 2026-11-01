# Spec Delta

## ADDED Requirements

### Requirement: The live build's tests hold whatever releases troupe has
The end-to-end tests of the live build SHALL pass for any set of release tags troupe-run/troupe has, none or several.
They SHALL take troupe's releases from what the build recorded, and check the site against them. Behaviour that
differs with the number of releases SHALL be tested on the fixture build, against fixed tags.

#### Scenario: Before troupe's first protocol release
- **WHEN** troupe has no `protocol-v*` tag and the site is built from it
- **THEN** the live `/protocol/` tests check that the page says there is no protocol release yet and has no release
  list, and they pass

#### Scenario: After troupe's first protocol release
- **WHEN** troupe has the tag `protocol-v0.1.0` and the site is built from it
- **THEN** the live `/protocol/` tests check that the page lists 0.1.0 as the latest release and that
  `/protocol/0.1.0/` is served, and they pass with no change to the tests

#### Scenario: A release the page leaves out
- **WHEN** the build records the protocol release 0.1.0 but `/protocol/` doesn't list it
- **THEN** the live `/protocol/` tests fail, naming the release list they expected

#### Scenario: A copy for a tag troupe doesn't have
- **WHEN** the latest protocol release the build records is 0.1.0
- **THEN** the live tests check that `/protocol/0.1.1/` and `/protocol/1/` serve nothing
