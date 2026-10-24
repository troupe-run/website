// The error the troupe sync raises, in a module of its own so that troupe-docs-lib.mjs and protocol-lib.mjs can both
// raise it without importing each other.

/** An input from troupe, or the environment, that the build won't guess about. The message names it and the fix. */
export class TroupeDocsError extends Error {
  name = 'TroupeDocsError';
}
