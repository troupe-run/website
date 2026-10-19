import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// The deploy starts after CI on a push to main, or on troupe's notice, and checks links before it publishes (spec:
// build-and-deploy; versioned-docs design D11). troupe-run/infrastructure#110's token can only dispatch it.
const TEXT = readFileSync('.github/workflows/deploy.yml', 'utf8');
type Step = { uses?: string; run?: string; with?: Record<string, unknown> };
type Job = { if?: string; needs?: string; concurrency?: { group: string; 'cancel-in-progress': boolean }; environment?: { name: string }; steps?: Step[] };
const workflow = parse(TEXT) as { on: Record<string, unknown>; jobs: Record<string, Job> };
const { build, deploy } = workflow.jobs;

describe('deploy.yml', () => {
  it('can be dispatched, and its dispatch takes no inputs', () => {
    expect(Object.keys(workflow.on)).toContain('workflow_dispatch');
    expect((workflow.on.workflow_dispatch as { inputs?: unknown } | null)?.inputs).toBeUndefined();
  });

  it('still starts after CI completes on main', () => {
    expect(workflow.on.workflow_run).toEqual({ workflows: ['CI'], types: ['completed'], branches: ['main'] });
  });

  it("builds only after CI passed on a push, or when it's dispatched on refs/heads/main", () => {
    expect(build.if).toBe(
      "(github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push')" +
        " || (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main')",
    );
  });

  it('checks out the commit CI passed, or the dispatched main', () => {
    const checkout = build.steps!.find((s) => s.uses?.startsWith('actions/checkout@'))!;
    expect(checkout.with?.ref).toBe('${{ github.event.workflow_run.head_sha || github.sha }}');
  });

  it('cancels a build a newer one makes redundant, and never a deploy that is publishing', () => {
    expect(build.concurrency).toEqual({ group: 'pages-build', 'cancel-in-progress': true });
    expect(deploy.concurrency).toEqual({ group: 'pages', 'cancel-in-progress': false });
  });

  it('checks internal links after the build and before the deploy job', () => {
    const steps = build.steps!;
    const built = steps.findIndex((s) => s.uses?.startsWith('withastro/action@'));
    const linkcheck = steps.findIndex((s) => s.run === 'npm run linkcheck');
    expect(built).toBeGreaterThanOrEqual(0);
    expect(linkcheck).toBeGreaterThan(built);
    expect(deploy.needs).toBe('build');
  });

  it('publishes only through the github-pages environment', () => {
    expect(deploy.environment?.name).toBe('github-pages');
  });

  it('never builds the fixture or sets TROUPE_DOCS: it builds only from troupe-run/troupe', () => {
    expect(TEXT).not.toMatch(/build:fixture|TROUPE_DOCS/);
  });
});
