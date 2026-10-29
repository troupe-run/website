import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The only way an e2e test runs axe (spec: accessibility; axe-core-4-14 design D3). tests/unit/e2e-axe.test.ts fails
// if another e2e file imports @axe-core/playwright, so every axe test reads ACCEPTED.
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

export type Accepted = {
  /** The axe rule id. */
  rule: string;
  /** The node's selector, exactly as axe reports it (its `target`, joined with spaces). */
  target: string;
  /** A page where axe reports it, for the test that fails when it no longer does (design D5). */
  page: string;
  /** Why the site accepts it, and where that was decided. */
  why: string;
};

// The axe findings the site accepts. Each excuses one rule on one node, and nothing else (design D2). It grows only by
// the owner's decision.
export const ACCEPTED: readonly Accepted[] = [
  {
    rule: 'label-content-name-mismatch',
    target: 'button[data-open-modal=""]',
    page: '/docs/programme/what-is-troupe/',
    why:
      "Starlight's search button. Its visible text beyond its name, \"Search\", is the Ctrl K (or ⌘ K) shortcut hint, " +
      'which it also exposes as aria-keyshortcuts. Starlight closed this as not planned ' +
      '(https://github.com/withastro/starlight/issues/4260), and the owner accepted it on 2026-10-29 ' +
      '(troupe-run/website#67). a11y.spec.ts checks the reason still holds.',
  },
];

type Violation = { id: string; impact?: string | null; nodes: { target: unknown[] }[] };

const targetOf = (node: { target: unknown[] }) => node.target.join(' ');

/** The serious and critical violations as `rule: target, target` lines, with accepted nodes taken out and a violation
 *  left with no nodes dropped. Matching is exact, so a changed selector is reported, not excused. */
export function unaccepted(violations: readonly Violation[], accepted: readonly Accepted[] = ACCEPTED): string[] {
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({ id: v.id, targets: v.nodes.map(targetOf).filter((t) => !accepted.some((a) => a.rule === v.id && a.target === t)) }))
    .filter((v) => v.targets.length > 0)
    .map((v) => `${v.id}: ${v.targets.join(', ')}`);
}

/** Runs axe on the page as it is, with the WCAG 2.2 AA rule tags, and returns what unaccepted() leaves. */
export async function seriousViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return unaccepted(results.violations);
}

/** The nodes axe reports for one rule on the page, whatever their impact and whether or not they're accepted. */
export async function reportedTargets(page: Page, rule: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withRules([rule]).analyze();
  return results.violations.flatMap((v) => v.nodes.map(targetOf));
}
