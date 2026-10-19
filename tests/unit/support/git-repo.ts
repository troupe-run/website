import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// Throwaway git repositories for the sync's tests: made in a fresh temporary folder, with no remote, and with git's
// global and system config (and so any hooks) ignored, so a test never touches a real repository.
const ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 'Fixture',
  GIT_AUTHOR_EMAIL: 'fixture@example.com',
  GIT_COMMITTER_NAME: 'Fixture',
  GIT_COMMITTER_EMAIL: 'fixture@example.com',
};

export interface Repo {
  path: string;
  /** Writes `files` (path to text; null deletes), commits them at `date`, and tags the commit with each of `tags`. */
  commit(files: Record<string, string | null>, date: string, tags?: string[]): void;
  git(...args: string[]): string;
  remove(): void;
}

export function makeRepo(): Repo {
  const path = mkdtempSync(join(tmpdir(), 'troupe-docs-test-'));
  const git = (...args: string[]) => execFileSync('git', args, { cwd: path, env: ENV, encoding: 'utf8' });
  git('init', '--quiet', '--initial-branch=main');
  return {
    path,
    git,
    commit(files, date, tags = []) {
      for (const [file, text] of Object.entries(files)) {
        const at = join(path, file);
        if (text === null) rmSync(at);
        else {
          mkdirSync(dirname(at), { recursive: true });
          writeFileSync(at, text);
        }
      }
      git('add', '--all');
      execFileSync('git', ['commit', '--quiet', '-m', `at ${date}`], {
        cwd: path, env: { ...ENV, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
      });
      for (const tag of tags) git('tag', tag);
    },
    remove: () => rmSync(path, { recursive: true, force: true }),
  };
}

/** A troupe page with valid front matter. */
export const page = (title: string, body = `${title}'s text.`) =>
  `---\ntitle: ${title}\ndescription: About ${title}.\nstatus: written\nprerelease: false\n---\n\n${body}\n`;
