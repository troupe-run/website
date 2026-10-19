import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// The weekly link check puts its issue on the roadmap board from a job of its own (troupe-run/website#18). The key
// that can write the board must never be readable where `npm ci` and the build run. These tests read the workflow's
// shape; that GitHub grants the environment on main only, and that the card appears, are proved by real runs
// (openspec change add-link-issue-to-board, Migration Plan).
type Step = { id?: string; uses?: string; run?: string; with?: Record<string, unknown>; env?: Record<string, string> };
type Job = {
  needs?: string | string[]; if?: string; environment?: unknown; permissions?: unknown;
  outputs?: Record<string, string>; steps?: Step[];
};
type Workflow = { on: Record<string, any>; permissions?: unknown; jobs: Record<string, Job> };

const workflow: Workflow = parse(readFileSync('.github/workflows/links-weekly.yml', 'utf8'));
const { links, board } = workflow.jobs;
const otherJobs = Object.entries(workflow.jobs).filter(([name]) => name !== 'board');
const steps = (job: Job) => job.steps ?? [];

describe('links-weekly.yml: the board job', () => {
  it('exists alongside links, and they are the only two jobs', () =>
    expect(Object.keys(workflow.jobs).sort()).toEqual(['board', 'links']));

  it('needs links and runs only when links handed over an issue URL and the run was not cancelled', () => {
    expect([board.needs].flat()).toEqual(['links']);
    expect(board.if?.replace(/\s+/g, ' ')).toBe("${{ !cancelled() && needs.links.outputs.issue-url != '' }}");
  });

  it('uses the board environment, and is the only job with any environment', () => {
    expect(board.environment).toBe('board');
    for (const [name, job] of otherJobs) expect(job.environment, name).toBeUndefined();
  });

  it('is the only job that mentions BOARD_APP_PRIVATE_KEY', () => {
    expect(JSON.stringify(board)).toContain('secrets.BOARD_APP_PRIVATE_KEY');
    for (const [name, job] of otherJobs) expect(JSON.stringify(job), name).not.toContain('BOARD_APP_PRIVATE_KEY');
  });

  it('has an empty permissions map, so its own GITHUB_TOKEN can do nothing', () =>
    expect(board.permissions).toEqual({}));

  it('has no checkout, setup or npm step', () => {
    for (const step of steps(board)) {
      expect(step.uses ?? '').not.toMatch(/^actions\/(checkout|setup-)/);
      expect(step.run ?? '').not.toMatch(/\bnpm\b|\bnpx\b|\bnode\b/);
    }
  });

  it('mints a token for the board App asking only for organisation projects: write', () => {
    const token = steps(board).find((s) => s.uses?.startsWith('actions/create-github-app-token@'));
    expect(token?.uses).toBe('actions/create-github-app-token@v3');
    expect(token?.with).toEqual({
      'client-id': '${{ vars.BOARD_APP_CLIENT_ID }}',
      'private-key': '${{ secrets.BOARD_APP_PRIVATE_KEY }}',
      owner: 'troupe-run',
      'permission-organization-projects': 'write',
    });
  });

  it('checks the issue URL\'s shape and then adds it to project 1 with that token, reading both through env', () => {
    const token = steps(board).find((s) => s.uses?.startsWith('actions/create-github-app-token@'));
    const add = steps(board).find((s) => s.run?.includes('gh project item-add'));
    expect(add?.env).toEqual({
      GH_TOKEN: `\${{ steps.${token?.id}.outputs.token }}`,
      ISSUE_URL: '${{ needs.links.outputs.issue-url }}',
    });
    expect(add?.run).toContain('^https://github\\.com/troupe-run/website/issues/[0-9]+$');
    expect(add?.run).toContain('gh project item-add 1 --owner troupe-run --url "$ISSUE_URL"');
    expect(add!.run!.indexOf('troupe-run/website/issues')).toBeLessThan(add!.run!.indexOf('gh project item-add'));
  });
});

describe('links-weekly.yml: the links job', () => {
  it('maps outputs.issue-url from the step that runs the external check', () => {
    const check = steps(links).find((s) => s.run?.includes('npm run linkcheck:external'));
    expect(check?.id).toBeTruthy();
    expect(links.outputs).toEqual({ 'issue-url': `\${{ steps.${check?.id}.outputs.issue-url }}` });
  });

  it('passes extra-url to the check through env as EXTRA_URL', () => {
    const check = steps(links).find((s) => s.run?.includes('npm run linkcheck:external'));
    expect(check?.env?.EXTRA_URL).toBe('${{ inputs.extra-url }}');
  });

  it('has contents: read and issues: write, and the workflow level grants nothing', () => {
    expect(links.permissions).toEqual({ contents: 'read', issues: 'write' });
    expect(workflow.permissions).toEqual({});
  });
});

describe('links-weekly.yml: triggers and inputs', () => {
  it('no run step expands an expression, so inputs and outputs reach the shell only through env', () => {
    for (const job of Object.values(workflow.jobs)) for (const step of steps(job)) expect(step.run ?? '').not.toContain('${{');
  });

  it('runs on its schedule and by hand, never on pull requests', () =>
    expect(Object.keys(workflow.on).sort()).toEqual(['schedule', 'workflow_dispatch']));

  it('declares extra-url only on workflow_dispatch, as an optional string that defaults to empty', () => {
    expect(workflow.on.workflow_dispatch.inputs['extra-url']).toMatchObject({ type: 'string', required: false, default: '' });
    expect(Object.keys(workflow.on.workflow_dispatch.inputs)).toEqual(['extra-url']);
  });
});
