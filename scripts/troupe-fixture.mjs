// npm run build:fixture: builds the site into dist-fixture/ against a troupe with releases, so /docs/next/, archived
// versions and the version menu are tested before troupe has a release (spec: quality-check; design D9). The troupe
// is a throwaway git repository, made from tests/fixtures/troupe-docs/ in a fresh temporary folder, with no remote,
// and removed afterwards. Nothing it builds is published: the deploy builds only from troupe-run/troupe. It reads the
// release milestones from tests/fixtures/milestones.json too, never troupe-run/infrastructure's, so /status/'s list is
// tested against fixed releases (spec: roadmap).
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const FIXTURE = join(ROOT, 'tests', 'fixtures', 'troupe-docs');
export const OUT_DIR = 'dist-fixture';
export const MILESTONES_FIXTURE = join(ROOT, 'tests', 'fixtures', 'milestones.json');

// git with no global or system config, so no hook or setting of the machine's touches the fixture.
const ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'troupe.run fixture',
  GIT_AUTHOR_EMAIL: 'fixture@troupe.run',
  GIT_COMMITTER_NAME: 'troupe.run fixture',
  GIT_COMMITTER_EMAIL: 'fixture@troupe.run',
};

/** Commits each step of `fixtureDir` (`1-troupe-v0.1.0`, …, `N-main`) in order, tagging all but main. */
export function makeFixtureRepo(fixtureDir = FIXTURE) {
  const path = mkdtempSync(join(tmpdir(), 'troupe-fixture-'));
  const git = (args, env = ENV) => execFileSync('git', args, { cwd: path, env, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git(['init', '--quiet', '--initial-branch=main']);
    const steps = readdirSync(fixtureDir).filter((n) => /^\d+-/.test(n)).sort((a, b) => parseInt(a) - parseInt(b));
    steps.forEach((step, i) => {
      rmSync(join(path, 'docs'), { recursive: true, force: true });
      cpSync(join(fixtureDir, step, 'docs'), join(path, 'docs'), { recursive: true });
      const date = `2026-0${i + 1}-01T00:00:00Z`;
      git(['add', '--all']);
      git(['commit', '--quiet', '-m', step], { ...ENV, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
      const name = step.replace(/^\d+-/, '');
      if (name !== 'main') git(['tag', name]);
    });
  } catch (error) {
    rmSync(path, { recursive: true, force: true });
    throw error;
  }
  return { path, remove: () => rmSync(path, { recursive: true, force: true }) };
}

/** Runs `fn` with a fixture repository, and removes it afterwards, whether `fn` returns or throws. */
export function withFixtureRepo(fn, fixtureDir = FIXTURE) {
  const repo = makeFixtureRepo(fixtureDir);
  try {
    return fn(repo.path);
  } finally {
    repo.remove();
  }
}

/**
 * Runs `fn` with a temporary folder shaped like an infrastructure checkout, whose tofu/milestones.json is `file`, and
 * removes it afterwards, whether `fn` returns or throws.
 */
export function withFixtureMilestones(fn, file = MILESTONES_FIXTURE) {
  const path = mkdtempSync(join(tmpdir(), 'milestones-fixture-'));
  try {
    mkdirSync(join(path, 'tofu'));
    copyFileSync(file, join(path, 'tofu', 'milestones.json'));
    return fn(path);
  } finally {
    rmSync(path, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const status = withFixtureRepo((path) => withFixtureMilestones((milestones) => {
    const build = spawnSync('npx', ['astro', 'build', '--outDir', OUT_DIR], {
      cwd: ROOT, env: { ...process.env, TROUPE_DOCS: path, TROUPE_MILESTONES: milestones }, stdio: 'inherit',
    });
    // The version tests read what this build was made from, not whatever the last sync left in src/generated/.
    if (build.status === 0) copyFileSync(join(ROOT, 'src', 'generated', 'troupe-docs.json'), join(ROOT, OUT_DIR, 'troupe-docs.json'));
    return build.status ?? 1;
  }));
  process.exit(status);
}
