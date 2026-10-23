// The release list on /status/ (spec: roadmap). Reads troupe-run/infrastructure's tofu/milestones.json, the
// milestones OpenTofu applies to every troupe-run repository, and marks each released when troupe has its tag
// (design D1 to D4), dated by the tag. The troupe-docs integration in astro.config.mjs and `npm run docs:sync` both call `syncRoadmap`
// after the docs sync, with the release tags /docs was built from.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** An input the roadmap won't guess about. The message names it and the fix. */
export class RoadmapError extends Error {
  name = 'RoadmapError';
}

export const MILESTONES = 'tofu/milestones.json';
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const RELEASE_TAG = /^troupe-v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/;
const FIX = 'Fix: correct it in troupe-run/infrastructure, which declares the milestones.';
// An ISO 8601 date and time, as git's iso-strict writes it. Its first ten characters are the day in the tag's own zone.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;

const parts = (version) => version.split('.').map(Number);
const byVersion = (a, b) => {
  const [x, y] = [parts(a), parts(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/**
 * The releases to list, in version order, from the milestones file's text and troupe's release tags with their dates.
 * A release that's out has `released` set to its tag's day (`YYYY-MM-DD`); nothing else is marked (design D2). Only
 * each milestone's title and description are read, and checked; every other key is ignored (design D4).
 * @param {string} text
 * @param {{ tag: string, date: string }[]} tags
 * @returns {{ releases: { version: string, description: string, released: string | null }[], latest: string | null }}
 */
export function readRoadmap(text, tags) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new RoadmapError(`${MILESTONES} isn't JSON: ${error.message}\n${FIX}`);
  }
  const list = data !== null && typeof data === 'object' && !Array.isArray(data) ? data.milestones : undefined;
  if (!Array.isArray(list)) throw new RoadmapError(`${MILESTONES} has no \`milestones\` list.\n${FIX}`);

  const seen = new Set();
  const milestones = list.map((milestone, i) => {
    const at = `${MILESTONES}: milestone ${i + 1}`;
    if (milestone === null || typeof milestone !== 'object' || Array.isArray(milestone)) {
      throw new RoadmapError(`${at} isn't an object.\n${FIX}`);
    }
    const { title, description } = milestone;
    if (typeof title !== 'string' || !VERSION.test(title)) {
      const shown = typeof title === 'string' ? JSON.stringify(title) : String(title);
      throw new RoadmapError(
        `${at}'s title ${shown} isn't a version.\nFix: title it MAJOR.MINOR.PATCH, with no leading zeros or "v", as in "0.3.0", in troupe-run/infrastructure.`,
      );
    }
    if (typeof description !== 'string' || description.trim() === '') {
      throw new RoadmapError(`${MILESTONES}: ${title} has no description.\nFix: describe what it adds for a user, in troupe-run/infrastructure.`);
    }
    if (seen.has(title)) throw new RoadmapError(`${MILESTONES}: two milestones are titled ${title}.\n${FIX}`);
    seen.add(title);
    return { title, description };
  });

  const released = new Map();
  for (const { tag, date } of tags) {
    const version = RELEASE_TAG.exec(tag)?.[1];
    if (!version) continue;
    if (typeof date !== 'string' || !ISO.test(date)) {
      throw new RoadmapError(`${tag}'s date ${JSON.stringify(date)} isn't a date git wrote. Fix: re-run the build; if it persists, check the tag in troupe-run/troupe.`);
    }
    released.set(version, date.slice(0, 10));
  }
  const releases = milestones
    .sort((a, b) => byVersion(a.title, b.title))
    .map(({ title, description }) => ({ version: title, description, released: released.get(title) ?? null }));
  return { releases, latest: [...released.keys()].sort(byVersion).at(-1) ?? null };
}

// Where the file comes from (design D1): a shallow bare clone of troupe-run/infrastructure's main, fetched on every
// run, or the folder TROUPE_MILESTONES names, read from its working tree.

export const INFRASTRUCTURE_REMOTE = 'https://github.com/troupe-run/infrastructure.git';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
const gitError = (error) => (error.stderr || error.message).trim();

function cloned(cacheDir, remote) {
  try {
    if (!existsSync(join(cacheDir, 'HEAD'))) {
      try {
        git(['clone', '--bare', '--quiet', '--depth', '1', '--single-branch', '--branch', 'main', remote, cacheDir]);
      } catch (error) {
        rmSync(cacheDir, { recursive: true, force: true });
        throw error;
      }
    } else {
      git(['--git-dir', cacheDir, 'remote', 'set-url', 'origin', remote]);
      git(['--git-dir', cacheDir, 'fetch', '--quiet', '--depth', '1', 'origin', '+refs/heads/main:refs/heads/main']);
    }
  } catch (error) {
    throw new RoadmapError(
      `couldn't fetch troupe-run/infrastructure (${remote}): ${gitError(error)}\n` +
        'Fix: retry once the network is back, or set TROUPE_MILESTONES to a local infrastructure checkout to build from it.',
    );
  }
  try {
    return git(['--git-dir', cacheDir, 'show', `refs/heads/main:${MILESTONES}`]);
  } catch {
    throw new RoadmapError(`troupe-run/infrastructure's main has no ${MILESTONES}.\n${FIX}`);
  }
}

function local(value) {
  const refuse = (why) =>
    new RoadmapError(
      `TROUPE_MILESTONES is set to ${JSON.stringify(value)}, ${why}. Fix: set it to an infrastructure checkout (the ` +
        `folder that holds ${MILESTONES}), or unset it to build from troupe-run/infrastructure.`,
    );
  if (value.trim() === '') throw refuse('which is empty');
  const root = resolve(value);
  if (!existsSync(root) || !statSync(root).isDirectory()) throw refuse("which isn't a folder");
  const file = join(root, MILESTONES);
  if (!existsSync(file) || !statSync(file).isFile()) throw refuse(`which has no ${MILESTONES}`);
  return readFileSync(file, 'utf8');
}

/**
 * The milestones file's text: from the folder TROUPE_MILESTONES names when it's set, otherwise from the clone in
 * `cacheDir`, fetched now.
 * @param {Record<string, string | undefined>} env
 * @param {{ cacheDir: string, remote?: string }} options
 * @returns {string}
 */
export function readMilestones(env, { cacheDir, remote = INFRASTRUCTURE_REMOTE }) {
  return env.TROUPE_MILESTONES === undefined ? cloned(cacheDir, remote) : local(env.TROUPE_MILESTONES);
}

/**
 * Reads the milestones, marks them against troupe's release tags, and writes `src/generated/roadmap.json` under
 * `root`, which the roadmap plugin renders into /status/ (design D8).
 * @param {{ env?: Record<string, string | undefined>, root: string, remote?: string, tags: { tag: string, date: string }[] }} options
 */
export function syncRoadmap({ env = process.env, root, remote, tags }) {
  const roadmap = readRoadmap(readMilestones(env, { cacheDir: join(root, '.cache', 'infrastructure.git'), remote }), tags);
  const at = join(root, 'src', 'generated', 'roadmap.json');
  mkdirSync(dirname(at), { recursive: true });
  writeFileSync(at, JSON.stringify(roadmap, null, 2) + '\n');
  return roadmap;
}
