import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// CI's `test` job is a required check, so it has to report on every pull request, every push to main and every commit
// the merge queue tests (spec: quality-check; troupe-run/infrastructure merge-queue design D6). Without merge_group the
// queue waits for `test` until it times out and lands nothing.
type Step = { uses?: string; run?: string };
const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as {
  on: Record<string, unknown>;
  jobs: Record<string, { steps?: Step[] }>;
};

describe('ci.yml', () => {
  it('runs on every pull request', () => {
    expect(Object.keys(workflow.on)).toContain('pull_request');
    expect(workflow.on.pull_request).toBeNull();
  });

  it('runs on a push to main, and on no other branch', () => {
    expect(workflow.on.push).toEqual({ branches: ['main'] });
  });

  it('runs on every commit the merge queue tests', () => {
    expect(Object.keys(workflow.on)).toContain('merge_group');
    expect(workflow.on.merge_group).toBeNull();
  });

  it('has one job, named test, the required check', () => {
    expect(Object.keys(workflow.jobs)).toEqual(['test']);
  });

  it("test's only run step is the check, so every event runs every gate", () => {
    const runs = workflow.jobs.test.steps!.filter((s) => s.run !== undefined).map((s) => s.run);
    expect(runs).toEqual(['uv run scripts/check.py']);
  });
});
