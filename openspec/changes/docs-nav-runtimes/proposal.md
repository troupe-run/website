# Proposal

## Why

troupe 0.2.0 added a Stagecraft page, Runtimes (`docs/stagecraft/runtimes.md`, "Point actors at a service", troupe-run/troupe#278). The sidebar order in `src/lib/docs-nav.ts` doesn't name it, so it lands last in Stagecraft, after Read the lineage, by the rule for unnamed pages. troupe-run/troupe#425's docs check for 0.2.0 found this, and it's the only thing on the site that 0.2.0 needs changed (#143).

## What Changes

- Name `runtimes` in the Stagecraft section's `pages`, after `bring-your-own-agent`: first the runners, then the services they talk to.

## Capabilities

### New Capabilities

### Modified Capabilities

None. The versioned-docs spec says named pages come first in the order given and the rest follow by title. It doesn't name the pages, so this is a change of data, not of a requirement (`skip_specs: true`).

## Impact

- `src/lib/docs-nav.ts`.
- Every docs version that has the page: `/docs/next/` now, and `/docs/` once `troupe-run-v0.2.0` is tagged. A version without the page is unaffected, since a named page a version lacks is skipped.
