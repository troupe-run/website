import { z } from 'astro/zod';

export const SITE_PATH_MESSAGE = 'must be a path on this site, starting with one "/", such as /docs/opening-night/install/';

// A host no link can name (.invalid is reserved, RFC 2606), so a link that resolves anywhere else named a host.
const BASE = 'https://link.invalid';

/**
 * A link to a page on this site: a path starting with `/` that names no host. A full URL would skip the build's
 * internal link check, even one to troupe.run. Whether it names a host is left to `URL`, which reads a link as browsers
 * do, so `//host/`, `/\host/` and a `/` followed by a tab or newline (which browsers drop) are all refused without
 * listing them (spec: landing-calls-to-action; troupe-run/website#83).
 */
export const sitePath = z.string().refine((s) => s.startsWith('/') && URL.parse(s, BASE)?.origin === BASE,
  { message: SITE_PATH_MESSAGE });
