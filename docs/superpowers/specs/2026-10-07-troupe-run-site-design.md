# troupe.run site: landing page and docs, design

- **Date:** 2026-10-07
- **Status:** Draft for the owner's review
- **Repo:** `troupe-run/troupe-run.github.io` (public), local at `~/Projects/troupe/troupe-run.github.io`
- **Brand reference:** [`docs/brand-guide.md`](../../brand-guide.md) (v0.2). This spec doesn't restate the brand; it
  says how the site applies it.

## 1. Purpose

troupe has no public face yet. This site gives it one:

- a **landing page** at `https://troupe.run` that says what troupe is and why it exists, and asks people to
  follow the build on GitHub;
- **docs** at `https://troupe.run/docs` whose structure is visible from day one, with real content only where
  we can honestly write it.

**Audience** (from discovery, Q1 A+B+D):
- solo developers who already run AI coding agents;
- small teams who want those agents to follow a real process with accountable sign-off;
- people following the build.

**Success for v1:**
- someone landing on the page can say in one sentence what troupe does;
- they can follow it on GitHub;
- they can see where the docs are heading;
- they can fix a docs page in two clicks.

## 2. Decisions this spec rests on

All are recorded with times in the brainstorm's decisions log.

| Area | Decision |
|---|---|
| Claims | Principles and intent only. Nothing unbuilt is described as working |
| Calls to action | GitHub (watch or star) now. Install when something ships, shown as "Install: coming". Replaced when 0.1.0 shipped by the `landing-calls-to-action` spec: an "Install (pre-alpha)" link to the install page (troupe-run/website#83) |
| Licence statements | The site shows its own licences (MIT for code, CC BY 4.0 for content). The product's licence (Apache-2.0 plus a CLA) is stated only in docs → Licensing, as intent, until the core repo is published |
| Theatre metaphor | Theatre in headings and visuals, plain words in body copy. One stage device per section |
| Voice | Dry and precise, with a thread of warm wry humour |
| Look and feel | Matinee, per the brand guide |
| Attribution | "a project by hps.gd" in the footer. No mention of predecessor projects |
| Analytics | GoatCounter: cookieless, no consent banner |
| Domain | Apex `troupe.run` is canonical, `www` redirects, docs are at `/docs`. DNS is done |
| Build | Astro, with Starlight for `/docs`, deployed by GitHub Actions to GitHub Pages |
| Revisit trigger | If customising Starlight turns into fighting it, revisit a hand-built docs layout. The criteria are in §6.4 |
| Bake-off write-up | After the results, not in v1 |
| GitHub call to action target | `https://github.com/troupe-run/troupe`, the product repo. It doesn't exist publicly yet and will be published later. No traffic is driven to the site before then (owner, 2026-10-07) |

## 3. Landing page

One page, top to bottom. The copy is drafted in the brand voice and **approved by the owner before launch**
(§8).

1. **Header:**
   - the lock-up (mark plus wordmark), linking to `/`;
   - navigation: How it works · Principles · Docs · GitHub;
   - no theme toggle (the theme follows the system, owner 2026-10-08);
   - no status pill (removed, owner review 2026-10-08).
2. **Hero:**
   - the curtain-call cast: human, agent, troupe (the triangle, centred), agent, human, each with its
     reflection, and a bow on hover;
   - **idle bows:** when no character has been hovered for 5 seconds, a random character bows by itself, never
     the same one twice in a row. The rules:
     - it only happens while the hero is on screen and the tab is visible;
     - it stops for good after 6 idle bows per page view (about 30 seconds). Any hover resets the
       5-second idle timer but not that cap. This keeps it inside WCAG 2.2.2, which covers content that moves on
       its own for more than 5 seconds;
     - it is off entirely under `prefers-reduced-motion`;
   - H1 ("Your agents need a director.") and a subhead. There is no eyebrow line and no "pre-alpha" badge
     (both removed, owner review 2026-10-08). The H1 has no width cap, so it sits on one line at 1024px and
     above; the subhead measure is about 60ch;
   - main call to action "★ Watch on GitHub", and a disabled "Install: coming", with their labels centred
     vertically on one baseline.
3. **Problem** (layout "P2", owner 2026-10-07; revised, owner review 2026-10-08):
   - the heading spans the full content column and wraps only if it must;
   - below it, the illustration in the cast style, centred across the full column: agents in single file,
     each passing work to the next, all waiting on one highlighted person;
   - below that, the four problems as a small grid with no boxes (a dot, a bold title and muted body text):
     one agent, one line · one bottleneck · no homework · no record. It has four columns at 1024px and above,
     two from 600 to 1023px, and one below 600px.
   - owner review 2026-10-08 (round 3): the four problems are dark cards (ink background, page-colour text, 14px
     radius, 16px padding, no border, 12px gap, equal height per row). Titles use the display face in the
     inverse accent. There are no bullet dots.
4. **How it works:** "A season, not a single show." (owner review 2026-10-08; was "A long run, not one night.").
   The whole section has a full-bleed `--surface` background under the curtain stripe (owner review 2026-10-08,
   round 3). Owner review 2026-10-08, round 4: the ring diagram became an **auto-advancing carousel with a loop
   dial**:
   - a tab strip of the four step labels (Cast, Perform, Cue, Notes) in the eyebrow style, the current one
     highlighted; on the right a loop dial (a ring with four dots at 12, 3, 6 and 9 o'clock, the current one
     tomato; the ring has no arrowhead, owner review 2026-10-08, round 6). There are no previous, next or
     pause/play buttons (owner amendment 2026-10-08, "just automate it");
   - one slide at a time, as a card with the step label, title, body and a small scene of characters. The
     troupe triangle is in every scene at a different position: left (Cast), right (Perform), centre (Cue), top
     (Notes);
   - it advances every 6s, wrapping Notes to Cast. It pauses on hover, while a tab has keyboard focus, while off
     screen or with the tab hidden. Under `prefers-reduced-motion` it never advances on its own. Activating a
     tab or a dial dot (or using the arrow, Home and End keys on the tablist) jumps to that step and stops the
     auto-advance for the rest of the page view. That is the WCAG 2.2.2 stop mechanism, as in the APG carousel
     pattern where rotation stops once the user activates a control;
   - motion (owner review 2026-10-08, round 5): on each advance the current card slides out to the left while the
     next slides in from the right, in parallel, over 500ms with ease-in-out. The wrap from Notes to Cast keeps
     the same direction. A jump to an earlier tab reverses it (current exits right, target enters from the left);
     a jump to a later tab goes left. All cards share one grid cell, so the stage is as tall as the tallest card
     and the stage clips the track (`overflow: hidden`): nothing shifts and the page never scrolls sideways.
     Off-stage cards are `inert` and `aria-hidden`. A single underline indicator slides to the active tab in
     parallel, with the same duration and easing; on the wrap it runs off the right end of the strip while a
     second one enters from the left onto Cast. The tab label colour changes in sync. The loop dial's current dot is
     one moving dot that travels the ring in the same 500ms: clockwise for forward moves (the wrap continues from 9
     to 12 o'clock), anticlockwise for a jump to an earlier step, over four faint static marks. The caption
     glyph is "↻" to match the clockwise direction (owner review 2026-10-08, round 6).
     Reflections: each character's reflection group is drawn in the solid colour and faded by one alpha mask
     (45% at the head to 0 at 75% of its height), so the triangle's fill and stroke no longer double up into a
     darker rim (owner review 2026-10-08). Under
     `prefers-reduced-motion` there is no sliding: the card swaps and the indicator jumps at once;
   - accessibility: a group with `aria-roledescription="carousel"`, a `tablist` with roving tabindex and
     Left/Right/Home/End keys, `tabpanel` slides labelled "N of 4: Step", and a live region that is `off` while
     rotating and `polite` once it has stopped;
   - without JavaScript all four slides show stacked and the controls are hidden;
   - "↻ and again, every showing" stays beneath the carousel.
5. **The cast (replaces "In your repo", owner review 2026-10-08):** a dark ink band with two columns, id `#the-cast`:
   - **left:** the eyebrow "The cast", the heading "Your process, as a cast list." and a short paragraph;
   - **right:** a playbill-style list of four roles (product owner, engineer, reviewer, QA). Each row has a
     small shape (lilac circle for a person, teal rounded square for an agent), the role name, a dotted
     leader and the holder's name. Under the rows sit the gate line ("Release: decided by the product owner")
     in the eyebrow style and a small "Example cast" note. The shapes are static and never idle-bow;
   - it replaces the YAML snippet, so the page invents no config syntax and says no "repo" or "YAML".
6. **Principles:** six cards (owner review 2026-10-08), each with a topic line icon in a faint-bordered tile. This is the only card grid
   on the page:
   - local-first, everything in your project;
   - work that branches (new, owner review 2026-10-08);
   - built for teams of agents and people;
   - escalation that does its homework;
   - lineage for every decision;
   - bring your own agent.

   The heading is "What we're building." The intro is "The ideas troupe is built on." The principles are present tense, with no commitments caveat; "Install: coming" is the landing page's pre-alpha signal. The cards sit three by two. "Config that survives hand-editing" was removed (owner review 2026-10-08).
7. **Closing call to action:** "Watch on GitHub to follow the build."
8. **Footer:**
   - "a project by hps.gd", linking to https://hps.gd (new tab);
   - links to GitHub and the docs;
   - copyright HPS.GD PTY LTD, also linking to https://hps.gd (new tab).
   - The privacy line and the licence line were removed (owner review 2026-10-08).

**Owner review 2026-10-08 (round 1):** landing copy says "project", not "repo", "YAML" or "config" (see the
brand guide, section 7). The Cast step reads "Agents and people, each in a named role." Pending owner decisions:
all four were then decided (owner review 2026-10-08, round 2): the heading "A season, not a single show."; a cast-list band replacing the YAML band; a sixth principle, "Work that branches"; and present-tense principles with "Install: coming" as the pre-alpha signal. The closing body reads "Follow along on GitHub."

**Layout rules:**
- Each section has a different shape, so no two neighbouring sections repeat a row of boxes (owner,
  2026-10-07: "the several rows of 4 boxes is repetitive").
- Mobile first.
- Usable from 320px wide, with no horizontal scroll.
- A 16px minimum side gutter.
- The cast shrinks to three characters below 480px.

## 4. Docs

### 4.1 Structure

The sidebar uses the theatre section labels. Page titles are plain.

| Section | Pages |
|---|---|
| Programme | What is troupe? · Status and roadmap · Principles |
| Opening night | Install · Your first theatre · Your first performance |
| The company | Theatres · Roles and actors · Performances and runs · Flows: fork, join, swarm, loop · Gates and decisions · Escalation · Notes: improving between runs · Lineage · Guests (packs) · The house (daemon, name TBC) |
| Stagecraft | Configure roles and people · Route decisions to the right person · Build a flow · Bring your own agent · Hand-edit config safely · Write a guest · Read the lineage |
| Prompt book | CLI · Config schema · Events · Guest manifest · Glossary |
| Backstage | Contributing · Licensing · Changelog |

### 4.2 Written pages and stubs

- **Written in v1:**
  - What is troupe?
  - Status and roadmap
  - Principles
  - Glossary (from the brand guide's vocabulary table)
  - Licensing (the per-component table and the CLA intent)
  - Contributing
- **Every other page is a stub.**
  - It is a real page in the sidebar, carrying a one-paragraph statement of what it will cover.
  - It has a "Planned: not written yet" note.
  - It has a "Help write this page" link (§4.3).
  - Stubs are marked as such in frontmatter (`status: planned`), so they can be listed and counted.
- **Every page, written or stub, carries a status note** until the feature it describes ships. The note reads
  "Pre-alpha: this page describes intended behaviour", and is driven by frontmatter, not hand-typed.

### 4.3 "Improve this page"

- Every docs page links to its own source on GitHub, using Starlight's built-in edit link.
  - It points at `https://github.com/troupe-run/troupe-run.github.io/edit/main/<path to the page>`.
  - The label is "Improve this page".
- On GitHub, that opens the file in the web editor. Someone without write access gets a fork and a pull request
  made for them, so they never clone anything.
- On stubs, the same link is shown inside the "Planned" note, labelled "Help write this page".
- Starlight's "last updated" date (from git) is shown on each page.
- **Contributions to the site repo** are accepted under the repo's own licences: MIT for code and CC BY 4.0 for
  content. This is "inbound = outbound", the same terms going in as coming out. The site repo does **not**
  require the CLA, which is for the core product repo. `CONTRIBUTING.md` says so.

### 4.4 Styling

- Starlight's colour variables are mapped onto the brand tokens (§5.1).
- The sidebar section labels use Bricolage Grotesque 800, 17px, `--tomato-text`, with a 2px divider and about
  26px of space above. There is no second-level subtitle.
- Page headings use the display face, and body text uses DM Sans.
- These changes are made through Starlight's CSS layer and, where necessary, its documented component
  overrides. Nothing is forked.

## 5. Architecture

```
troupe-run.github.io/
├─ astro.config.mjs          Astro + Starlight (mounted under /docs), site: https://troupe.run
├─ brand/                    Source SVGs: mark, lock-up, triangle, characters, icons
├─ scripts/render-assets.mjs SVG → favicon PNG/ICO, social and repo previews, avatar
├─ public/                   CNAME, rendered assets
├─ src/
│  ├─ styles/tokens.css      The one source of colour and type tokens (light and dark)
│  ├─ styles/starlight.css   Maps Starlight's variables onto tokens.css
│  ├─ components/            Header, Hero, Problem, HowItWorks, Principles, ClosingCta, Footer,
│  │                         Character, Mark, TopicIcon
│  ├─ content/copy/          Landing-page copy, one file per section (what the owner reviews)
│  ├─ content/docs/docs/     Docs pages (served at /docs/…)
│  └─ pages/index.astro      The landing page
├─ tests/                    Playwright smoke tests + axe accessibility checks
└─ .github/workflows/        ci.yml (pull requests), deploy.yml (push to main → Pages)
```

### 5.1 Tokens

- `tokens.css` defines every token from the brand guide for light mode and dark mode.
  - Dark mode applies under `prefers-color-scheme: dark`, unless the visitor has chosen light.
  - It also applies whenever `[data-theme="dark"]` is set.
- Components use only tokens, never hex values. A test checks this (§7).

### 5.2 Characters, mark and icons

- **`Character.astro`** takes `kind` (human, agent or troupe), and optionally `size` and `bow`.
  - It draws the head and eyes.
  - It draws the reflection: the same shape, inverted, fading from 45% opacity to transparent by about 75% of
    its height.
  - The bow on hover is turned off under `prefers-reduced-motion`.
- **`CastIdle`** is a small client script that runs the idle bows (§3).
  - It uses an IntersectionObserver for "hero on screen" and `visibilitychange` for "tab visible".
  - It triggers the same bow as hover by toggling a class, so there is one animation definition.
- **`Mark.astro`** draws the mark (circle, triangle, square, with round eyes) and the lock-up.
- **`TopicIcon.astro`** draws the topic line icons, in a 36px tile with a `--soft` border and `--tomato-text`
  strokes.
- All of these are inline SVG, so they inherit the tokens and switch with the theme.

### 5.3 Brand assets

- The source SVGs are in `brand/`.
- `scripts/render-assets.mjs` renders them with `@resvg/resvg-js` into `public/`:
  - favicon: SVG, plus 32px ICO and 180px apple-touch PNG, all the triangle with eyes;
  - social preview: 1200×630;
  - GitHub org avatar: 500×500;
  - repo social previews: 1280×640;
  - README banner: SVG.
- The rendered files are committed, so a deploy never depends on the renderer.
- CI re-runs the script and fails if the output differs from what's committed.
- Uploading the org avatar and the repo previews to GitHub is a manual step for the owner. GitHub has no API for
  either.

### 5.4 Theme

- **The theme follows the system; there is no picker** (owner 2026-10-08). The landing page has no toggle, and
  Starlight's theme select is replaced by an empty component.
- Nothing is stored or read: any `starlight-theme` value left in localStorage is ignored.
- Inline scripts in the head (the landing layout, and an overridden Starlight `ThemeProvider` on the docs) set
  `data-theme` from `prefers-color-scheme` before first paint, and update it live on the media query's `change`
  event, so the page never flashes the wrong theme. `tokens.css` also covers no-JavaScript.

### 5.5 Fonts and analytics

- Bricolage Grotesque, DM Sans and DM Mono are self-hosted from the Fontsource packages. There are no requests
  to Google Fonts.
- GoatCounter is loaded as one script tag, on production builds only.

## 6. Build and deploy

### 6.1 CI (`ci.yml`, on pull requests and on pushes to main)

1. `astro check`
2. `astro build`
3. The asset-render check (§5.3)
4. A link check over the built site, internal links only. External links are checked weekly, outside pull
   requests (`links-weekly.yml`). A broken one fails that run and opens or updates one "Broken external links"
   issue, and a clean run closes it (replaced by `openspec/specs/link-checking`, troupe-run/website#5). GitHub
   turns the schedule off after 60 days without repository activity. The watcher for that lives in
   troupe-run/infrastructure (troupe-run/infrastructure#60).
5. Playwright smoke tests with axe (§7)

### 6.2 Deploy (`deploy.yml`, on pushes to main)

- `withastro/action` builds the site.
- `actions/deploy-pages` publishes it to GitHub Pages.
- Pages source is set to "GitHub Actions".
- Deploy runs only after CI passes on the same commit.

### 6.3 Domain

- `public/CNAME` contains `troupe.run`. DNS at Gandi is done:
  - apex A and AAAA records point at GitHub Pages;
  - `www` is a CNAME to `troupe-run.github.io.`;
  - the org domain is verified.
- "Enforce HTTPS" is switched on once the certificate is issued.

### 6.4 When to revisit Starlight

We move to a hand-built docs layout if any of these happens:

- the approved sidebar or page style needs more than a handful of component overrides;
- an override breaks on a minor Starlight upgrade;
- a docs feature we need fights Starlight's routing. The landing page is outside Starlight, so it isn't a
  trigger.

## 7. Testing

- **Playwright smoke tests:**
  - the landing page renders every section;
  - the GitHub call to action has a real URL;
  - the "Install: coming" button is disabled;
  - the landing page and a docs page follow an emulated light or dark scheme, ignore a stale stored theme, have no
    theme picker, and update when the scheme changes at runtime;
  - a docs page and a stub page both render;
  - the stub shows its "Planned" note and its "Help write this page" link;
  - every docs page has an "Improve this page" link pointing at its own source file.
- **Accessibility:**
  - axe runs on the landing page, a written docs page and a stub, in both light and dark mode, with zero
    serious or critical violations;
  - this includes colour contrast, so a token change that fails WCAG AA fails the build.
- **Viewport:** at 320px and 390px wide, the page doesn't scroll horizontally.
- **Reduced motion:** with reduced motion emulated, hovering a character doesn't animate it, and no idle bow
  fires.
- **Idle bows** (with a fake clock):
  - after 5 seconds with no hover, exactly one character bows;
  - a hover resets the timer;
  - no bow fires once the hero has scrolled out of view;
  - the bows stop after the sixth one.
- **Token discipline:** no hex colour values appear in `src/components/` or `src/pages/`. Only `tokens.css`
  holds them.
- **Test naming:** each test's name says exactly what its assertions check, and no more.

## 8. Copy and review flow

- All landing-page copy is in `src/content/copy/`, one Markdown file per section, so the owner can review it as
  text.
- The written docs pages are reviewed the same way.
- Nothing launches until the owner has approved the copy.
- The problem section's layout gets an in-context review at the same time.

## 9. Out of scope for v1

- A build log or blog
- The bake-off write-up
- An install snippet
- A guest directory
- A public `/brand` page (the brand guide stays in the repo)
- An email waitlist
- Search beyond Starlight's built-in Pagefind search
- Translations

## 10. Open points

- ~~**Before driving any traffic to the site,** `github.com/troupe-run/troupe` must exist and be public.~~
  Done: it was public by 2026-10-16, and the weekly link check requests it (troupe-run/website#5).
- **Pushing the local brand-guide commits:** these are held until the owner has read the guide.
- **"The house" and "house rules":** not yet agreed as names. The docs page title carries "name TBC".
