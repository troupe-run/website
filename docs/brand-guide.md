# troupe brand guide

This is the reference for anything that carries the troupe brand: the site, the docs, GitHub, slides and
social posts. If something here is wrong or missing, fix this file first, then the thing you were making.

- **Direction:** "Matinee". Playful, characterful and warm, with geometric characters, light by default.
- **Status:** v0.2, 2026-10-07. Colours, type, the mark, characters, the metaphor rule and voice are decided.
  Final SVG coordinates are set when the asset files are drawn; the geometry below is what they must meet.
- **Owner:** hps.gd.

## 1. Name

- The product is **troupe**, always lowercase, including at the start of a sentence and in headings.
- **troupe.run** is the website and domain. Use it when you mean the site, not the product.
- Attribution is "a project by hps.gd", with hps.gd written as a domain.
- Don't attach suffixes or invented forms ("Troupe AI", "trouping"). Don't refer to predecessor projects.

## 2. The mark and wordmark

- **The mark** is three heads in a row, like a cast at a curtain call, each with eyes:
  1. a **lilac circle**: a human;
  2. a **tomato rounded triangle**, in the middle: troupe itself;
  3. a **teal rounded square**: an agent.
- **The wordmark** is "troupe" in Bricolage Grotesque, weight 800, lowercase, tracking −0.02em.
- **Lock-up:** the mark sits to the left of the wordmark, centred vertically on the x-height.
- **Geometry**, where h is the height of the circle and the square:
  - the circle and the square are h tall and h wide, and all three heads share a baseline;
  - the triangle is equilateral, with rounded corners, and about 1.04h tall. The small overshoot is
    deliberate: a pointed shape looks smaller than it measures. Being equilateral, it is slightly wider than h;
  - the gap between heads is about 0.1h–0.15h;
  - the corner radius of the agent square is 0.28h.
- **Eyes:**
  - every head has two round white eyes, whatever its shape. Shape-matched eyes were tried (square eyes on
    the square, triangle eyes on the triangle) and rejected on 2026-10-07: triangle eyes did not read as eyes;
  - the triangle's eyes sit lower, in the wide part of the shape. That reads as deliberate with the triangle in
    the middle, which is why it goes there.
- **Clear space:** keep one head's width (h) clear on every side of the mark or lock-up.
- **Small sizes and the favicon:**
  - Below 24px wide, use the **triangle alone, with eyes**. The circle and square are too hard to tell apart
    at that size.
  - The favicon is always the triangle with eyes.
- **Don't:**
  - recolour the heads, or change their order or shapes;
  - add outlines, shadows or gradients;
  - set the wordmark in any other face;
  - stretch or rotate the mark;
  - put the light mark on a mid-tone background.

## 3. Colour

The tokens are CSS custom properties. The theme follows the system colour scheme, with no picker (owner,
2026-10-08). The dark values apply under `prefers-color-scheme: dark` and under `[data-theme='dark']`, which
the site sets from the system scheme.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | Page background (cream) | `#FFF8EE` | `#1A1830` |
| `--surface` | Cards and panels | `#FFFFFF` | `#24213F` |
| `--ink` | Body text, headings | `#1D1B2F` | `#FFF4E2` |
| `--muted` | Secondary text | `#4A4760` | `#C9C2D8` |
| `--tomato` | Brand and troupe itself. Fills, shapes, the curtain | `#FF5A3C` | `#FF5A3C` |
| `--tomato-text` | Tomato for text and small UI | `#CE3D21` | `#FF8E76` |
| `--teal` | Agents. Shapes | `#14857D` | `#14857D` |
| `--teal-text` | Teal for text | `#137E76` | `#3CC7BC` |
| `--lilac` | Humans. Shapes | `#7461D9` | `#7461D9` |
| `--lilac-text` | Lilac for text | `#715ED8` | `#A79AF0` |
| `--sunflower` | Highlights, the curtain trim, badges | `#FFC93C` | `#FFC93C` |
| `--inverse-accent` | Accent text on an ink (inverted) panel | `#FFC93C` | `#C23A1F` |
| `--soft` | Faint borders (icon tiles) | `#1D1B2F33` | `#FFF4E23D` |
| `--line` | Card borders | `#1D1B2F14` | `#FFF4E21C` |

**One pattern for every accent:** the shape colour is identical in light and dark mode, so the mark and the
characters never change. Each accent also has a `-text` token per mode, because no single shade of teal or
lilac reaches 4.5:1 on both the cream and the navy backgrounds (the best possible is about 3.8:1). Tomato
would pass as text in dark mode unchanged, but gets a lighter `-text` shade too, so the rule has no exception.

**Rules:**
- **Teal means agents, lilac means humans, and tomato is troupe itself, everywhere.** Never swap them, and don't use either one for
  anything unrelated to agents or humans.
- **Tomato is the brand and the call to action.** Use it for one primary action per view.
- **Text colour:**
  - Body text is always `--ink` or `--muted`.
  - Coloured text uses only the `-text` tokens.
  - In light mode, `--tomato` and `--sunflower` are never used for text.
- **Buttons:**
  - A tomato button takes ink text (contrast 5.4:1).
  - Don't put white text on `--tomato` (3.1:1).
  - If white text is needed, fill with `--tomato-text` instead (4.9:1).
- **Sunflower is decoration only:** no text on the cream background, and never the only signal of meaning.
  Ink text on a sunflower badge is fine (10.9:1).
- **In light mode, sunflower text on an ink panel (10.9:1) is the one sanctioned use of sunflower as text.** It is
  carried by `--inverse-accent`; in dark mode that token is tomato (`#C23A1F`, 4.92:1 on the cream `--ink` card),
  not sunflower.
- **The `-text` token values were adjusted on 2026-10-07.**
  - The original "text-safe" values from the Matinee direction were `#D63F22` (4.34:1 on `--bg`), and
    teal and lilac at 4.25 and 4.47. All three failed WCAG AA for body-size text.
  - The current values are the nearest of the same hue that reach at least 4.6:1 on `--bg`.

**Measured contrast in light mode** (WCAG; AA needs 4.5:1 for normal text and 3:1 for large text and UI):

| On `--bg` | Ratio | On `--bg` | Ratio |
|---|---|---|---|
| `--ink` | 15.9 | `--teal-text` | 4.66 |
| `--muted` | 8.4 | `--lilac-text` | 4.64 |
| `--tomato-text` | 4.62 | `--tomato` (shapes only) | 2.94 |

**Dark mode:**
- Every `-text` token measures above 6:1 on both dark backgrounds.
- The shape colours stay above the 3:1 needed for graphics: tomato 5.0, sunflower 10.0, teal 3.4 and lilac
  3.3 on the darker surface.

## 4. Type

| Use | Face | Weights | Notes |
|---|---|---|---|
| Display: headings, wordmark, step names | **Bricolage Grotesque** | 700–800 | Tracking −0.02em, line-height about 1.1 |
| Body, UI | **DM Sans** | 400, 600 | Line-height about 1.55, measure at most 65ch |
| Code, labels, eyebrows | **DM Mono** | 400, 500 | 500 is the heaviest cut that exists; don't fake bold |

- **Eyebrows** (the small label above a section heading): DM Mono 400, 11–12px, uppercase, tracking +0.06em,
  `--tomato-text`. Step labels (for example "Cast", "Perform", "Cue", "Notes") use the same style.
- **Docs sidebar section labels** ("Programme", "Opening night", and so on):
  - Bricolage Grotesque 800, 17px, `--tomato-text`, sentence case;
  - a 2px divider and roughly 26px of space above each label;
  - no subtitle under the label.
- All three faces are on Google Fonts under the OFL licence. Self-host them in the site build.

## 5. Characters and illustration

- **The cast:**
  - humans are **circles**, in lilac;
  - agents are **rounded squares**, in teal;
  - troupe itself is an **equilateral rounded triangle**, in tomato. It appears at most once in a scene,
    usually in the middle.
  - The shape tells you which is which, and so does the colour; never rely on colour alone.
- **Style:**
  - flat geometry, with no outlines or drop shadows;
  - **reflections:** each character's body is a copy of its head at the same size, flipped upside down
    below it. It starts at 45% opacity and fades to transparent by about 75% of its height. This is the only
    gradient in the style. It is drawn in the solid colour and faded by a single alpha mask, so a
    stroked shape (the triangle) shows no darker rim where fill and stroke overlap;
  - faces are optional and minimal: two round eyes, never shaped to match the head;
  - props (a tick, a diff, a clipboard) are simple shapes in `--ink` or `--sunflower`.
- **Characters are not icons.** Topic icons (for example on feature cards) are separate line icons:
  - 2px strokes in `--tomato-text`;
  - in a 36px tile with a `--surface` fill, a 2px `--soft` border and a 10px radius, matching the
    secondary button;
  - they never reuse the brand shapes;
  - they never use teal or lilac, because those colours mean agents and humans.
- **One character per section, doing that section's job.** For example, a reviewer circle holding a tick,
  or an agent square carrying a diff.
- **Stage devices** are the curtain (a tomato and tomato-text stripe with a sunflower trim), the spotlight (a
  soft sunflower radial wash) and the curtain-call line-up. Use at most one device per section.
- **Motion:**
  - Characters may "bow" on hover: a small dip and tilt of about 200ms.
  - **Idle bows:** in a cast line-up, if nothing has been hovered for 5 seconds, one random character bows by
    itself. They run only while the cast is on screen, and stop after 6 per page view.
  - **The "season" carousel** is the second, and only other, self-moving element (owner, 2026-10-08). It
    advances one step every 6 seconds. It pauses on hover, while a tab has keyboard focus, while it is off
    screen and while the tab is hidden, and activating any tab or dial dot stops it for the rest of the page
    view (the WCAG 2.2.2 stop mechanism; there is no Pause button). Under `prefers-reduced-motion` it never
    advances on its own.
  - Nothing else moves on its own.
  - Every animation is turned off under `prefers-reduced-motion`.

## 6. The theatre metaphor

**The rule: theatre in headings and visuals, plain words in body copy.** One stage device per section.
Every sentence should still say what troupe does to someone who skips the headings.

**Product vocabulary.** What each term means is in the
[glossary](https://github.com/troupe-run/troupe/blob/main/docs/prompt-book/glossary.md), in troupe's user docs
(published at <https://troupe.run/docs/prompt-book/glossary/>). It's the single source, so this guide doesn't repeat
the meanings.
This table holds each term's status, and the words we don't use. Terms such as "theatre", "actor" and "role" are
product nouns: body copy uses them as plainly as any other word. The rule above is about stage devices, not these.

| Term | Status |
|---|---|
| theatre | In use |
| role | In use |
| actor | In use |
| system | Decided 2026-10-11: the actor kind for troupe acting by itself |
| cast | Reserved |
| performance | In use |
| rehearsal | Reserved, 2026-10-19: ahead of the feature that builds it |
| stage | In use, 2026-10-19 |
| notes | Landing-page term, 2026-10-07 |
| gate | In use |
| escalation | In use |
| cue | Provisional, 2026-10-11 |
| lineage | In use |
| guest | Decided "for now" |
| the house | Agreed, 2026-10-19 |
| repertoire | Rejected: long and easy to get wrong |
| rep | Rejected: long and easy to get wrong |
| company (as a product noun) | Rejected: clashes with a SaaS tenant |
| part | Rejected, 2026-10-19: "role" is clearer, and the two were never told apart |
| house rules | Rejected, 2026-10-19: say "policy". Policy can be set at house level too, so "house rules" would read as that level only |

- **Docs section labels** may be theatrical: Programme, Opening night, The company, Stagecraft, Prompt book,
  Backstage. Page titles are always plain ("Install", "Roles and actors").
- **Don't** use pun headlines, "break a leg", standing ovations or emoji theatre masks. The test is whether
  it clarifies or decorates. Only the first is allowed.

## 7. Voice

**Dry and precise, with a thread of warm wry humour.** Short sentences. Every claim is something we can
check.

- **Do:**
  - say what it does, plainly, before anything clever;
  - name the real problem: one agent working in a line, one person answering everything, no research done,
    no record kept;
  - label anything unbuilt as intent ("pre-alpha", "illustrative");
  - allow one wry line per section at most;
  - write principles in the present tense, as what troupe does, with no commitments caveat. "Install: coming"
    is the landing page's pre-alpha signal (owner review, 2026-10-08).
  - say "theatre" for a theatre, in headings and body copy alike, never mixed with "project". "Project" appears
    only to explain what a theatre is ("a theatre is a project directory with troupe config"). Say what it is in
    plain words, not "repo", "YAML" or "config", except where the technical term is genuinely necessary (owner
    review, 2026-10-08; "theatre" decided 2026-10-19, troupe-run/troupe#15);
- **Don't:**
  - use hype ("revolutionise", "supercharge", "10x", "the future of");
  - borrow authority (logo walls, "trusted by");
  - claim a feature that hasn't shipped;
  - use exclamation marks.
- **Examples:**
  - Yes: "Decisions go to whoever owns them, with the research done."
  - No: "Supercharge your AI workflow with intelligent human-in-the-loop orchestration!"
  - Yes, the wry thread: "A season, not a single show."
- **Before 1.0, claims are principles and intent only.** No benchmarks, no customer claims, no licence or
  pricing statements beyond what has been decided and published.

## 8. Assets

| Asset | Formats | Status |
|---|---|---|
| Mark (three heads), light and dark | SVG | To make |
| Triangle with eyes (small-size mark) | SVG | To make |
| Lock-up (mark plus wordmark), light and dark | SVG | To make |
| Favicon set (triangle with eyes) | SVG, ICO, 180px apple-touch | To make |
| Social preview for the site | PNG 1200×630 | To make |
| GitHub org avatar | PNG 500×500 | To make |
| Repo social previews | PNG 1280×640 | To make |
| README header banner | SVG | To make |
| Colour and type tokens | CSS custom properties | Defined above; ship with the site |

The source SVGs live in this repo under `brand/`. The built copies the site serves go in `public/`.

## 9. Licensing and trademark

- The troupe name, mark, wordmark and characters are trademarks of **HPS.GD PTY LTD**. They are not licensed
  under the site's MIT (code) or CC BY 4.0 (content) licences.
- Community use is welcome for referring to troupe: "works with troupe", or an article about it. It is not
  allowed in a way that suggests endorsement, or as the name or logo of another product or a fork.

## 10. Open points

- **Problem section (resolved 2026-10-10):** the standalone section restated How it works in the negative and its text was too small. Each How-it-works step now names the problem it fixes inside its own sentence ("…, so the work isn't stuck behind one agent at a time"). A separate "Instead of" label read as mashed together (owner).
