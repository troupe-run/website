// Shared by the internal link check (CI) and the external one (weekly): run linkinator over a built site and
// read its JSON. linkinator 8 leaves skipped links out of its output, and reports local files as paths on disk.
import { spawnSync } from 'node:child_process';

/** Runs linkinator over `dir`. Returns `{ result }`, or `{ error, stdout, stderr }` when it printed no JSON. */
export function runLinkinator(dir, skips = [], extraArgs = []) {
  const args = [
    'linkinator',
    dir,
    '--recurse',
    ...skips.flatMap((s) => ['--skip', s]),
    ...extraArgs,
    '--format',
    'json',
  ];
  const r = spawnSync('npx', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  try {
    return { result: JSON.parse(r.stdout) };
  } catch {
    return { error: 'linkinator did not produce JSON output', stdout: r.stdout, stderr: r.stderr };
  }
}

const isExternal = (url) => /^https?:\/\//.test(url);

/** Counts what a linkinator result checked. `external` is how many http(s) links were requested. */
export function summarise(result) {
  const links = result?.links ?? [];
  const scanned = links.filter((l) => l.state !== 'SKIPPED');
  return {
    links,
    scanned,
    broken: links.filter((l) => l.state === 'BROKEN'),
    external: scanned.filter((l) => isExternal(l.url)).length,
  };
}
