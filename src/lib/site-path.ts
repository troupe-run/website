import { z } from 'astro/zod';

export const SITE_PATH_MESSAGE = 'must be a path on this site, starting with one "/", such as /docs/opening-night/install/';

/**
 * A link to a page on this site: a path starting with one `/`. A full URL would skip the build's internal link check,
 * and `//host/…` is another host to a browser (spec: landing-calls-to-action; troupe-run/website#83).
 */
export const sitePath = z.string().refine((s) => s.startsWith('/') && !s.startsWith('//'), { message: SITE_PATH_MESSAGE });
