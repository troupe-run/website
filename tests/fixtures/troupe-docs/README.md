A troupe history for the fixture build (`npm run build:fixture`; spec: quality-check; design D9). Each folder is the
whole of `docs/` at one commit, oldest first; `scripts/troupe-fixture.mjs` commits them in order into a throwaway git
repository and tags each with the name after the number, except `main`. Between versions a page is removed
(`old-guide`), one is renamed (`build-a-flow` to `design-a-flow`), one is added (`roles-and-actors`, planned) and one
exists only on main (`new-guide`, which the site's sidebar order doesn't name).
