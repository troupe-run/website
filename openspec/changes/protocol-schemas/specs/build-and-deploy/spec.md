# Spec Delta

## MODIFIED Requirements

### Requirement: A deploy checks internal links before it publishes
Every deploy SHALL run the internal link check on the site it built, and SHALL NOT publish when a link is broken or a
reference in a published protocol schema doesn't resolve (spec: protocol-schemas). The site that was live before SHALL
stay live.

#### Scenario: troupe adds a broken link
- **WHEN** a dispatched deploy builds a page whose link leads nowhere on the site
- **THEN** the deploy fails at the link check, names the link, and publishes nothing

#### Scenario: troupe removes a definition a schema still refers to
- **WHEN** a dispatched deploy builds a schema whose `$ref` names a `$defs` entry its target no longer has
- **THEN** the deploy fails at the link check, names the schema and the reference, and publishes nothing
