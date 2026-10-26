// Reads the site's Node version from .nvmrc for the deploy, which builds with withastro/action: it takes a
// node-version but can't read a version file, and without one it builds on its own default (troupe-run/website#4).
// It reads the file as actions/setup-node does for CI, but refuses what setup-node would quietly skip or guess at,
// so the deploy stops rather than building on a version nobody wrote down.
// Run on the runner's own Node, before setup-node: it uses node:fs only.
import { readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VALID = 'A valid .nvmrc is one line holding one Node version, such as 26.';

// setup-node's rule for one line: an optional "node " or "nodejs " and an optional "v", then the version.
const LINE = /^(?:node(?:js)?\s+)?v?(\S+)$/;

function refuse(problem) {
  return new Error(`.nvmrc ${problem}. ${VALID}`);
}

export function parseNvmrc(text) {
  try {
    const json = JSON.parse(text);
    if (typeof json === 'object' && json !== null) throw refuse(`is JSON: ${JSON.stringify(text)}`);
  } catch (e) {
    if (!(e instanceof SyntaxError)) throw e;
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) throw refuse('holds no version');
  const version = lines.length === 1 ? LINE.exec(lines[0])?.[1] : undefined;
  if (!version) throw refuse(`holds more than one value: ${JSON.stringify(text)}`);
  return version;
}

export function readNvmrc(path = '.nvmrc') {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') throw refuse(`is missing (looked for ${resolve(path)})`);
    throw e;
  }
  return parseNvmrc(text);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const version = readNvmrc();
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
    console.log(version);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
