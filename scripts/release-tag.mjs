// Which of troupe's tags is a release, for /docs/ (troupe-docs-lib.mjs) and /status/ (roadmap-lib.mjs) alike (spec:
// versioned-docs, roadmap). Every troupe package versions on its own, and the release people install is the bundle's,
// troupe-run-vX.Y.Z, released after the components it pins (troupe-run/troupe#218). Core's troupe-v* is one component
// among several, and like the others it isn't read.

import { TroupeDocsError } from './troupe-error.mjs';

export const RELEASE_PREFIX = 'troupe-run-v';
export const RELEASE_FORM = 'troupe-run-vMAJOR.MINOR.PATCH';
const RELEASE = /^troupe-run-v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * The release's version as `[major, minor, patch]`, or null for another component's tag. A tag that starts
 * `troupe-run-v` but isn't a release is an error, never skipped.
 * @param {string} tag
 * @returns {[number, number, number] | null}
 */
export function releaseVersion(tag) {
  if (!tag.startsWith(RELEASE_PREFIX)) return null;
  const m = RELEASE.exec(tag);
  if (!m) throw new TroupeDocsError(`${tag} isn't a release tag troupe.run can build: use ${RELEASE_FORM}`);
  return /** @type {[number, number, number]} */ (m.slice(1, 4).map(Number));
}
