import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// The weekly dependency report keeps one "Dependency advisories" issue and puts a new one on the board (spec:
// quality-check; quality-gates design D5). These tests read the workflow's shape; the issue upkeep itself is
// scripts/quality_gates.py's, tested in troupe-run/infrastructure.
type Step = { id?: string; uses?: string; run?: string; env?: Record<string, string> };
type Job = { needs?: string | string[]; if?: string; environment?: unknown; permissions?: unknown; steps?: Step[] };
type Workflow = { on: Record<string, unknown>; permissions?: unknown; jobs: Record<string, Job> };

const text = readFileSync('.github/workflows/dependency-report.yml', 'utf8');
const workflow: Workflow = parse(text);
const { audit, board } = workflow.jobs;

describe('dependency-report.yml', () => {
  it('runs every Monday and by hand', () => {
    expect(workflow.on).toEqual({ schedule: [{ cron: '23 4 * * 1' }], workflow_dispatch: null });
  });

  it('gives audit issues: write and contents: read, and nothing to the workflow as a whole', () => {
    expect(workflow.permissions).toEqual({});
    expect(audit.permissions).toEqual({ contents: 'read', issues: 'write' });
    expect(audit.environment).toBeUndefined();
  });

  it('runs the delivered module to audit and keep the issue', () => {
    const report = audit.steps!.find((s) => s.id === 'report')!;
    expect(report.run).toBe(
      'python3 scripts/quality_gates.py report --repository "$GITHUB_REPOSITORY" --github-output "$GITHUB_OUTPUT"',
    );
    expect(report.env).toEqual({ GH_TOKEN: '${{ github.token }}' });
  });

  it('adds a newly opened issue to the board from a job of its own, which alone reads the key', () => {
    expect([board.needs].flat()).toEqual(['audit']);
    expect(board.if).toBe("${{ !cancelled() && needs.audit.outputs.issue-url != '' }}");
    expect(board.environment).toBe('board');
    expect(text.split('BOARD_APP_PRIVATE_KEY').length - 1).toBe(1);
    const add = board.steps!.at(-1)!.run!;
    expect(add).toContain('^https://github\\.com/troupe-run/website/issues/[0-9]+$');
    expect(add.trim().endsWith('gh project item-add 1 --owner troupe-run --url "$ISSUE_URL"')).toBe(true);
  });
});
