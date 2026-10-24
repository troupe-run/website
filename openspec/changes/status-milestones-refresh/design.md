# Design: status-milestones-refresh

## Context

See proposal.md for why. Each point below was read in Astro 7.3.6, Starlight 0.42.5 and `withastro/action@v6`:

- **Two pages are rendered from data outside their own file.** `astro.config.mjs` registers two Sätteri mdast plugins:
  `roadmapPlugin` for `src/content/docs/status.md` and `protocolPlugin` for `src/content/docs/protocol.md`. Each takes
  a `load` (`loadRoadmapInputs`, `loadProtocolInputs`) that reads `src/generated/` and a copy file. The sync writes
  `src/generated/` in `astro:config:setup` on every command except preview, before content is synced.
- **The glob loader skips an unchanged file.** Starlight's `docsLoader()` is `{ name, load: createGlobLoadFn(...) }`
  over Astro's glob loader. For each file, the loader looks up the stored entry by id. If the stored entry's `digest`
  equals `generateDigest(contents)`, the loader keeps it, rendered HTML included, and returns
  (`astro/dist/content/loaders/glob.js`, around line 94). With no stored entry, the file is parsed and rendered again.
- **The store survives between builds.** A build keeps it in `<cacheDir>/data-store.json`, which is
  `node_modules/.astro/` by default (`content/paths.js`). Dev keeps it in `.astro/`. `withastro/action` restores
  `node_modules/.astro` with key `astro-cache-Linux-<sha>` and restore-key `astro-cache-Linux-`. It saves a new cache
  only after a miss.
- **The store is cleared only on a config change.** `content-layer.js` clears it when the Astro version, the content
  config's digest, or a digest of the Astro config changes. The Astro config digest leaves out `vite` and
  `integrations`, but includes `redirects` and `outDir`. A new troupe minor adds a docs version and its redirect, so
  it clears the store. Nothing else that feeds the two pages does.
- **The Content Loader API gives a loader** `store` (`get`, `entries`, `delete`), `meta` (a per-collection key-value
  store kept with the data store), `config` (`root` among it) and `generateDigest`.
- **Other docs pages are safe.** troupe's pages are rewritten by the sync, so their own digest follows their content.
  The plugin that rewrites their links (`troupe-links`) reads only the page's own path. The version banner, menu and
  "View source" are components, rendered on every build.

## Goals / Non-Goals

**Goals:**

- A stored render of `/status/` or `/protocol/` is used only when everything it was rendered from is unchanged. This
  holds in the deploy, in local builds and in dev.
- One list says which pages are rendered from which inputs, and both the plugins and the invalidation read it, so a
  new generated page can't be wired to one and not the other.
- A test that fails on `main` and passes after the fix, built the way the deploy builds: on a reused store.

**Non-Goals:**

- Starting a build when infrastructure's milestones change (troupe-run/troupe#139).
- Watching `src/generated/` during `astro dev`. The sync runs at startup, as now.
- Any change to the deploy workflow, or to what either page says.

## Decisions

**D1. Drop the stale entry in the loader, not the cache in the deploy.** The docs collection's loader becomes a
wrapper around `docsLoader()`. Before calling the glob loader, it works out each generated page's input digest. If the
digest differs from the one in `meta` for that page, it deletes the page's entry from `store` and records the new
digest. With no stored entry, the glob loader parses and renders the page from the current `src/generated/`.

Considered:
- **`cache: false` on `withastro/action`.** One line, but it fixes the deploy only. Local builds still keep the old
  list, so the roadmap spec's `TROUPE_MILESTONES` preview fails on a second build. Every deploy would also re-render
  every docs version and re-optimise every image from nothing.
- **Put the input digest into the Astro config** (for example, as a field the config digest hashes), so a change
  clears the whole store. That depends on which config fields Astro hashes, which isn't a public contract. It would
  also throw away every docs page's render to refresh two pages.
- **Delete `data-store.json` from the integration.** That depends on Astro's private file name and location, and has
  the same all-or-nothing cost.
- **Render the lists in components** (MDX, or the existing `MarkdownContent` override), which render on every build.
  The pages' words would move out of Markdown, which the roadmap change chose to keep (archived
  `2026-10-23-status-roadmap-releases`, design D5). That's a redesign, not a fix.

The wrapper uses only `store`, `meta`, `config` and `generateDigest`, which are the Content Loader API. It keeps
Starlight's loader as it is, which the config's constraint on customising Starlight asks for.

**D2. One table of generated pages, read by both sides.** A new module, `scripts/generated-pages.mjs`, exports the
pages rendered from generated data. Each entry has the page's path from the root, the `load(root)` that returns its
inputs (`loadRoadmapInputs`, `loadProtocolInputs`, unchanged) and the plugin factory. `astro.config.mjs` registers
each entry's plugin from the table, in place of the two calls written out today. The loader wrapper digests each
entry's inputs. So the digest covers exactly what the plugin renders from: the milestones and tags through
`roadmap.json`, the protocol releases (not the whole `troupe-docs.json`, which changes on every troupe push) and each
copy file.

The digest is `generateDigest(JSON.stringify(load(root)))`, keyed in `meta` by the page's path. `root` is
`fileURLToPath(config.root)`. An entry is found by its stored `filePath`, not a guessed id, and a page with no stored
entry needs nothing deleted.

**D3. The rebuild test runs the real build on a reused store.** A new script, `scripts/rebuild-test.mjs`
(`npm run test:rebuild`), is a gate in `check.py` after the fixture build. With a fixture troupe repository and fixture
milestones (`withFixtureRepo`, `withFixtureMilestones`), it builds three times into one temporary `--outDir`. Keeping
one `outDir` keeps the Astro config digest the same, so the store is reused.

1. **Seed:** the fixture as it is.
2. **Milestones only:** the fixture milestones with one milestone renumbered and one re-described. The variant is
   made from `tests/fixtures/milestones.json` in code, so the fixture keeps one source. The test asserts `/status/`
   lists the new versions in the new order, with the new description.
3. **Tags only:** the milestones from step 1, and in the fixture repository a troupe patch tag above its latest
   (`troupe-v0.2.1`) and a protocol tag above its latest. The test asserts `/status/`'s status line names 0.2.1, and
   `/protocol/` lists the new protocol release first, as the latest.

After steps 2 and 3, the test fails if the build log shows the store was cleared ("Clearing content store") or a
config change. Without that check, the test would prove nothing. It reads the built HTML with plain string and regex
checks on the list markup the plugins write. It needs no browser.

The test is written and run on `main` before the fix, where steps 2 and 3 must fail. The proposal and the issue's
"done when" ask for that.

**D4. Where the rebuild test leaves things.** Its output folder, fixture repositories and milestone folders are
temporary and removed in `finally`. The build rewrites `src/generated/`, which the fixture build already leaves
holding fixture data. The fixture tests read `dist-fixture/troupe-docs.json`, which `troupe-fixture.mjs` copies, so the
e2e gate after it sees the same state as today. The store in `node_modules/.astro` is left as the last rebuild wrote
it. The next build with a different `outDir` clears it, as any `outDir` change does today.

## Risks / Trade-offs

- **[Risk] Astro changes the glob loader's skip rule or the loader API.** → The rebuild test runs the real build, so
  an upgrade that breaks the fix fails the check. It doesn't depend on how the fix works.
- **[Risk] A future page rendered from generated data, wired outside the table.** → `astro.config.mjs` registers
  page plugins only from the table (D2). A unit test checks that each table entry's page exists and that its `load`
  reads without error.
- **[Trade-off] The rebuild test adds three builds to the check.** → Measured when it's built (tasks). If it's too
  slow, the seed can reuse the fixture build. That changes the steps, not the behaviour checked.
- **[Risk] The loader runs before the sync has written `src/generated/`.** → It doesn't: the sync runs in
  `astro:config:setup`, before content sync. If the file is missing, `load` throws, naming the file, and the build
  stops. Malformed input is an error, never an empty digest.

## Migration Plan

Nothing to migrate. On the first deploy after the merge, the restored store has no recorded digests, so both pages
are rendered again once and their digests recorded. Rollback is reverting the commit. The stale-cache behaviour comes
back with it, and deleting the `astro-cache-Linux-*` caches clears it again, as the issue's comment showed.
