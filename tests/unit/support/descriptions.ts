import { section, table } from './markdown';

// How troupe is described: the set the brand guide's §7 records (troupe-run/website#26, spec: descriptions).

export const PARTS = ['Tagline', 'Sentence', 'Paragraph', 'Status line', 'One-line description', 'Page title'] as const;
export type Part = (typeof PARTS)[number];
export type DescriptionSet = Record<Part, string>;

/** GitHub's limit on an org's description, which the one-line description is. */
export const LIMIT = 160;
const HEADING = '### How troupe is described';

/** The set, read from the brand guide's "How troupe is described" table. Throws naming any part missing or unknown. */
export function readSet(guide: string): DescriptionSet {
  const s7 = section(guide, '7.');
  const start = s7.indexOf(`\n${HEADING}\n`);
  if (start < 0) throw new Error(`the brand guide's §7 has no "${HEADING}" subsection`);
  const next = s7.indexOf('\n#', start + 1);
  const rows = table(s7.slice(start, next < 0 ? undefined : next)).rows;
  const found = new Map(rows.map(([part, text]) => [part, text]));
  const missing = PARTS.filter((p) => !found.has(p));
  const unknown = [...found.keys()].filter((p) => !(PARTS as readonly string[]).includes(p));
  if (missing.length || unknown.length) {
    throw new Error(`the brand guide's "How troupe is described" table: missing ${JSON.stringify(missing)}, ` +
      `unknown ${JSON.stringify(unknown)}. It needs exactly ${JSON.stringify(PARTS)}`);
  }
  return Object.fromEntries(PARTS.map((p) => [p, found.get(p)!])) as DescriptionSet;
}

/** Where the set disagrees with itself, one message each; empty when it agrees. */
export function setProblems(set: DescriptionSet): string[] {
  const problems: string[] = [];
  if (!set.Paragraph.startsWith(set.Sentence)) {
    problems.push(`the paragraph doesn't open with the sentence "${set.Sentence}"`);
  }
  const oneLine = `${set.Tagline} ${set.Sentence}`;
  if (set['One-line description'] !== oneLine) {
    problems.push(`the one-line description isn't the tagline, then the sentence: it should be "${oneLine}"`);
  }
  const length = set['One-line description'].length;
  if (length > LIMIT) problems.push(`the one-line description is ${length} characters, over the limit of ${LIMIT}`);
  return problems;
}

/** The landing page's description: the one-line description, then the status line. */
export const pageDescription = (set: DescriptionSet) => `${set['One-line description']} ${set['Status line']}`;
