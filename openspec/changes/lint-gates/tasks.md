# Tasks

Load rule: check `uptime` before `npm ci` or the full check; start only under a 1-minute load of 40.

## 1. Tools

- [x] 1.1 `npm ci`, then add the seven dev dependencies at D5's exact versions with `npm install -D -E`. Verify by
      package that `package-lock.json` changes only those and their own dependencies, and `npm ci --dry-run` agrees
- [x] 1.2 `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `src/env.d.ts` and the npm scripts `lint`,
      `format:check` and `typecheck`, as D2-D4

## 2. Bring the code into line

- [x] 2.1 `npx prettier --write .` as its own commit. Verify `prettier --check .` passes and no Markdown, MDX,
      generated or delivered file changed
- [x] 2.2 Fix each ESLint finding, or turn the rule off in `eslint.config.js` with the reason. Verify `eslint .` exits 0
- [x] 2.3 Fix each `tsc --noEmit` error. Verify it exits 0

## 3. The gates

- [ ] 3.1 Tests first in `scripts/tests/`: `gates()` lists `eslint` and `prettier` right after `npm ci` and `tsc`
      right after `astro check`, each through `npx --no-install`. Verify they fail on the base code, then add the gates to `scripts/check.py`
- [ ] 3.2 Verify each spec scenario by hand: an unused variable fails `eslint`, a double-quoted `.ts` fails
      `prettier`, a string assigned to a number fails `tsc`; revert each
- [ ] 3.3 The full check passes (`uv run scripts/check.py`), under the load rule
- [ ] 3.4 README's contributing notes name the three scripts

## Workflow follow-up

- The pull request closes troupe-run/website#126; after merge, comment on troupe-run/infrastructure#323 that website's
  half landed.
