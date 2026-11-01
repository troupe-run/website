## MODIFIED Requirements

### Requirement: A malformed protocol tag stops the build
A tag that starts `protocol-v` but isn't `protocol-v` followed by three dot-separated whole numbers with no leading
zeros SHALL stop the build, with an error naming the tag and the accepted form. Tags of troupe's other components SHALL
be ignored.

#### Scenario: A pre-release tag
- **WHEN** troupe has a tag `protocol-v1.0.0-rc.1`
- **THEN** the build fails, naming `protocol-v1.0.0-rc.1` and the accepted form `protocol-vMAJOR.MINOR.PATCH`

#### Scenario: Another component's tag
- **WHEN** troupe has a tag `troupe-run-v0.1.0` or `troupe-v0.1.0`
- **THEN** `/protocol/` gets no copy from it
