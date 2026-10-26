# Design

## Context

See proposal.md for why. Since #4, CI and the weekly link check use `actions/setup-node` with
`node-version-file: .nvmrc`, and the deploy runs `scripts/node-version.mjs` to feed `withastro/action`'s
`node-version`. `tests/unit/workflow-node-version.test.ts` fails if any workflow names a version of its own. So the
workflows need no edit: changing `.nvmrc` moves all three.

What nothing checks yet is the two copies written for people: `engines.node` (`>=22.12.0`) and `CONTRIBUTING.md`
("Node 22 or later (the version in `.nvmrc`)"). `scripts/check.py` already reads `.nvmrc` for its "install Node N or
later" message, so it needs no change.

Observed on 2026-10-26: the maintainer's machine runs Node v26.12.1, so local runs of the check are already on 26.
No `.npmrc` exists, so npm treats `engines` as a warning, not a refusal.

## Goals / Non-Goals

**Goals:**
- One edit to `.nvmrc` moves CI, the deploy and the weekly link check to 26, as it should since #4.
- The next move can't leave `engines.node` or `CONTRIBUTING.md` behind without a failing test.

**Non-Goals:**
- Upgrading Astro, Starlight, starlight-blog, Playwright or anything else. If something fails on 26, that's a finding
  to report, not a reason to widen this change.
- Making npm refuse a wrong Node (`engine-strict`). It would turn a warning into a blocked `npm ci` for anyone on an
  older Node, which the owner hasn't asked for.
- Checking that `.nvmrc` names an LTS line. That's a judgement made by a person reading the release schedule, once
  every two years or so.

## Decisions

**D1. `.nvmrc` holds the major only: `26`.** It's what it holds now (`22`). setup-node resolves it to the newest 26.x
on each run, so security releases arrive without a commit. The alternative, a full version such as `26.12.1`, makes
builds repeatable to the patch but means a commit for every Node security release, and nothing here has needed that
precision.

**D2. `engines.node` becomes `>=26.0.0`.** The floor is the major in `.nvmrc`. No dependency needs a later 26.x: the
highest floor in `package-lock.json` is `>=22.19.0` (undici). The current `>=22.12.0` exists because Astro needed 22.12;
26.0.0 is already above every floor. It stays open-ended (`>=`), as now, so a contributor on a newer Node isn't warned.

**D3. `CONTRIBUTING.md` keeps a number, and a test holds it to `.nvmrc`.** Dropping the number ("the version in
`.nvmrc` or later") would leave nothing to fall behind, but a reader setting up would have to open a dotfile to learn
what to install. The issue asks for the number to change, and the contributing spec already says "at the version in
`.nvmrc` or later". The test keeps the convenience honest.

**D4. The agreement test reads closed shapes and refuses anything else.** A new `tests/unit/node-version-copies.test.ts`
reads the major from `.nvmrc` with `readNvmrc()` from `scripts/node-version.mjs`, the same reader the deploy uses.
- `engines.node` must match `>=MAJOR[.MINOR[.PATCH]]`. Any other shape (`^26`, `26.x`, a `||` range, missing) fails
  and says what it found and what shape is expected, rather than being parsed approximately. Adding a range parser,
  or `semver` as a direct dependency, isn't worth it for one field we write ourselves.
- `CONTRIBUTING.md` must contain exactly one "Node N or later". None, or more than one, fails and says so.
- Each mismatch names the file, what it says and what `.nvmrc` holds. The test's own logic is a pure function given
  the three texts, with cases for each scenario in the spec, so it can be shown to fail without editing real files.
- It's a separate file from `workflow-node-version.test.ts` because that one is about workflows reading `.nvmrc`,
  and this one is about text for people agreeing with it.

**D5. The refusal message's example says 26.** `VALID` in `scripts/node-version.mjs` says "such as 22". It's an
example, not a rule, but it should show the version the site uses. Its test is updated with it. The parser's test
inputs (`'22'`, `'v22'`, `'node 22'`) stay: they test parsing, not the site's version.

**D6. Merge on or after 2026-10-28.** The work and the pull request can happen before, since nothing ships until the
merge. Before merging, check that `https://nodejs.org/dist/index.json` lists a 26.x with an `lts` codename. If 26's
LTS slips, hold the merge and say so on the issue, rather than shipping on a Current release.

## Risks / Trade-offs

- [Something in the toolchain breaks on 26: a removed API in a script, a native binary (sharp, lightningcss, the Astro
  compiler bindings) without a 26 build, Playwright's browsers.] → CI's full `test` job on the pull request runs on
  26 because it reads `.nvmrc`. A failure there stops the change and gets reported with its output. Native packages
  here ship Node-API or WASM builds, which aren't tied to a Node major, so this is unlikely but is exactly what the
  run checks.
- [npm 11 or later, bundled with 26, rewrites `package-lock.json` beyond the root `engines`.] → Don't commit lock
  churn that isn't the `engines` line. If `npm install` insists on more, stop and report it, since that's a dependency
  change this proposal says it doesn't make.
- [The weekly link check isn't run by the pull request.] → It reads `.nvmrc` the same way CI does, and the workflow
  test covers its wiring. Its first scheduled run after the merge is checked for "26" in its setup-node step.
- [Contributors still on 22 get an npm warning and may hit real failures.] → `CONTRIBUTING.md` says 26, and the check's
  message names it. That's the intended outcome.

## Migration Plan

1. Land the change by rebase merge on or after 2026-10-28 (D6). The merge's CI run and the deploy that follows run on
   26.
2. Read the deploy's build log and confirm the Node set up is 26.x. Do the same for the next weekly link check.
3. Rollback: revert the commit. `.nvmrc` goes back to `22` and every workflow follows, with the copies going back with
   it, so the agreement test still passes.
