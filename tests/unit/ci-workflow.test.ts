import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// CI's `test` job is a required check, so it has to report on every pull request, every push to main and every commit
// the merge queue tests (spec: quality-check; troupe-run/infrastructure merge-queue design D6). Without merge_group the
// queue waits for `test` until it times out and lands nothing. `changes` decides whether `test` runs: not on a draft,
// and not on a push to main the merge queue already passed (ci-once-per-commit design D1, D5).
type Step = { id?: string; uses?: string; run?: string; if?: string; env?: Record<string, string> };
type Job = {
  name?: string;
  if?: string;
  needs?: string | string[];
  permissions?: Record<string, string>;
  outputs?: Record<string, string>;
  steps?: Step[];
};
const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as {
  on: Record<string, unknown>;
  jobs: Record<string, Job>;
};
const changes = workflow.jobs.changes;
const test = workflow.jobs.test;
const step = (id: string) => changes.steps!.find((s) => s.id === id)!;

describe('ci.yml', () => {
  it("runs on a pull request's default events and on being marked ready for review", () => {
    expect(workflow.on.pull_request).toEqual({ types: ['opened', 'synchronize', 'reopened', 'ready_for_review'] });
  });

  it('runs on a push to main, and on no other branch', () => {
    expect(workflow.on.push).toEqual({ branches: ['main'] });
  });

  it('runs on every commit the merge queue tests', () => {
    expect(Object.keys(workflow.on)).toContain('merge_group');
    expect(workflow.on.merge_group).toBeNull();
  });

  it('has two jobs: changes, which decides, and test, the required check', () => {
    expect(Object.keys(workflow.jobs)).toEqual(['changes', 'test']);
  });

  it("test's only run step is the check, so every event that runs it runs every gate", () => {
    const runs = test.steps!.filter((s) => s.run !== undefined).map((s) => s.run);
    expect(runs).toEqual(['uv run scripts/check.py']);
  });
});

describe("ci.yml's changes job", () => {
  it("doesn't run on a merge group, so the queue's commit always runs test", () => {
    expect(changes.if).toBe("github.event_name != 'merge_group'");
  });

  it('may read Actions runs, for the merge-queue lookup, and contents, and nothing else', () => {
    expect(changes.permissions).toEqual({ contents: 'read', actions: 'read' });
  });

  it('answers test from whichever of its three answering steps ran', () => {
    expect(changes.outputs).toEqual({
      test: '${{ steps.draft.outputs.test || steps.main.outputs.test || steps.ready.outputs.test }}',
    });
  });

  it('answers test=false on a draft, with a notice saying when test runs', () => {
    const draft = step('draft');
    expect(draft.if).toBe("github.event_name == 'pull_request' && github.event.pull_request.draft");
    expect(draft.run).toContain('::notice::');
    expect(draft.run).toContain('marked ready');
    expect(draft.run).toContain("echo 'test=false' >> \"$GITHUB_OUTPUT\"");
  });

  it('answers test=true on a pull request that is ready for review', () => {
    const ready = step('ready');
    expect(ready.if).toBe("github.event_name == 'pull_request' && !github.event.pull_request.draft");
    expect(ready.run).toContain("echo 'test=true' >> \"$GITHUB_OUTPUT\"");
  });

  it('on a push, checks out (only then) and asks queue_passed.py about the pushed commit', () => {
    const main = step('main');
    expect(main.if).toBe("github.event_name == 'push'");
    expect(main.env).toMatchObject({ GH_TOKEN: '${{ github.token }}', SHA: '${{ github.sha }}' });
    expect(main.run).toContain(
      'python3 scripts/queue_passed.py --repository "$GITHUB_REPOSITORY" --sha "$SHA" >> "$GITHUB_OUTPUT"',
    );
    const checkouts = changes.steps!.filter((s) => s.uses?.startsWith('actions/checkout@'));
    expect(checkouts).toHaveLength(1);
    expect(checkouts[0].if).toBe("github.event_name == 'push'");
    expect(changes.steps!.indexOf(checkouts[0])).toBeLessThan(changes.steps!.indexOf(main));
  });
});

describe("ci.yml's test job", () => {
  it('needs changes, and runs unless changes succeeded and said test=false', () => {
    // !cancelled() keeps test running when changes was skipped (a merge group) or failed: its output is then empty.
    expect(test.needs).toBe('changes');
    expect(test.if).toBe("${{ !cancelled() && needs.changes.outputs.test != 'false' }}");
  });
});
