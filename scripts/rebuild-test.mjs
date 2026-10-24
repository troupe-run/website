// npm run test:rebuild: builds the fixture site three times on one content store, as the deploy does when it restores
// an earlier build's cache, and checks that /status/ and /protocol/ follow their sources each time (spec: roadmap,
// protocol-schemas, quality-check; troupe-run/website#35). The seed is the fixture as it is; the second build changes
// only the milestones, and the third only troupe's tags. All three go to one temporary --outDir, since the outDir is
// part of the config Astro hashes, and a config change clears the store, which would prove nothing. Every failure is
// reported, not just the first.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENV, MILESTONES_FIXTURE, withFixtureMilestones, withFixtureRepo } from './troupe-fixture.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// What Astro logs when it throws the store away (astro/dist/content/content-layer.js).
const CLEARED = /Clearing content store|Astro config changed|Content config changed|Astro version changed/;

const decode = (html) => html.replace(/<[^>]+>/g, '').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').trim();

/** Each list's items as text, in page order, for the lists with `className`. */
export function lists(html, tag, className) {
  const found = [...html.matchAll(new RegExp(`<${tag} class="${className}"[^>]*>([\\s\\S]*?)</${tag}>`, 'g'))];
  return found.map(([, body]) => [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, item]) => decode(item)));
}

/** The paragraph after /status/'s Status heading: the status line. */
export function statusLine(html) {
  return decode(/id="status"[\s\S]*?<p>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '');
}

/** The milestones under "Milestones" on a built /status/: each item's version and description. */
const planned = (html) => lists(html, 'ol', 'roadmap-list').at(-1) ?? [];

/** The fixture milestones with 0.10.0 renumbered to 0.2.5 and 0.3.0 re-described. */
export function changedMilestones(text) {
  const data = JSON.parse(text);
  for (const m of data.milestones) {
    if (m.title === '0.10.0') Object.assign(m, { key: '0.2.5', title: '0.2.5' });
    if (m.title === '0.3.0') m.description = 'Three: re-described for the rebuild test';
  }
  return JSON.stringify(data, null, 2);
}

function build({ troupe, milestones, outDir }) {
  const run = spawnSync('npx', ['astro', 'build', '--outDir', outDir], {
    cwd: ROOT, env: { ...process.env, TROUPE_DOCS: troupe, TROUPE_MILESTONES: milestones }, encoding: 'utf8',
  });
  const log = `${run.stdout}${run.stderr}`;
  if (run.status !== 0) throw new Error(`the build failed (exit ${run.status}):\n${log}`);
  return log;
}

const page = (outDir, path) => readFileSync(join(outDir, path, 'index.html'), 'utf8');

function main() {
  const failures = [];
  const expect = (ok, message) => ok || failures.push(message);
  const outDir = mkdtempSync(join(tmpdir(), 'rebuild-test-'));
  try {
    withFixtureRepo((troupe) => withFixtureMilestones((milestones) => {
      const file = join(milestones, 'tofu', 'milestones.json');
      const original = readFileSync(MILESTONES_FIXTURE, 'utf8');

      console.log('==> seed: the fixture as it is');
      build({ troupe, milestones, outDir });
      const seed = page(outDir, 'status');
      expect(statusLine(seed).includes('0.2.0'), `seed: /status/'s status line doesn't name 0.2.0: "${statusLine(seed)}"`);

      console.log('==> rebuild 1: only the milestones changed (0.10.0 renumbered to 0.2.5, 0.3.0 re-described)');
      writeFileSync(file, changedMilestones(original));
      const first = build({ troupe, milestones, outDir });
      expect(!CLEARED.test(first), "rebuild 1 didn't use the seed's content store: its log says the store was cleared or the config changed");
      const got1 = planned(page(outDir, 'status'));
      expect(
        got1.map((item) => item.split(' ')[0]).join() === '0.2.5,0.3.0,1.0.0' &&
          got1[1] === '0.3.0 Three: re-described for the rebuild test',
        "rebuild 1: /status/'s Milestones should list 0.2.5, 0.3.0 (\"Three: re-described for the rebuild test\") and " +
          `1.0.0, in that order, but lists:\n  ${got1.join('\n  ')}`,
      );

      console.log('==> rebuild 2: only the tags changed (troupe-v0.2.1 and protocol-v1.0.1 added)');
      writeFileSync(file, original);
      // Lightweight tags on troupe-v0.2.0's commit, made with the fixture's git, which no setting of the machine's touches.
      const git = (args) => execFileSync('git', ['-C', troupe, ...args], { env: ENV, encoding: 'utf8' }).trim();
      const at = git(['rev-list', '-n', '1', 'troupe-v0.2.0']);
      for (const tag of ['troupe-v0.2.1', 'protocol-v1.0.1']) git(['tag', '--no-sign', tag, at]);
      const second = build({ troupe, milestones, outDir });
      expect(!CLEARED.test(second), "rebuild 2 didn't use the earlier build's content store: its log says the store was cleared or the config changed");
      const status = page(outDir, 'status');
      expect(statusLine(status).includes('0.2.1'), `rebuild 2: /status/'s status line should name 0.2.1 as the latest release, but says: "${statusLine(status)}"`);
      const back = planned(status).map((item) => item.split(' ')[0]);
      expect(
        back.join() === '0.3.0,0.10.0,1.0.0',
        `rebuild 2: /status/'s Milestones should be back to 0.3.0, 0.10.0 and 1.0.0, but lists: ${back.join(', ')}`,
      );
      const protocol = lists(page(outDir, 'protocol'), 'ul', 'protocol-releases')[0] ?? [];
      expect(
        protocol[0]?.startsWith('1.0.1') && protocol.length === 4,
        `rebuild 2: /protocol/ should list 1.0.1 first, as the latest, of four releases, but lists:\n  ${protocol.join('\n  ')}`,
      );
    }));
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
  if (failures.length > 0) {
    console.error(`rebuild test: ${failures.length} failed\n- ${failures.join('\n- ')}`);
    return 1;
  }
  console.log('rebuild test: /status/ and /protocol/ followed their sources on both rebuilds');
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main());
