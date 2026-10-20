// Small Markdown readers shared by the unit tests that hold text in Markdown files (the brand guide, the glossary).

/** The text of a `## ` section whose heading starts with `prefix`, up to the next `## ` heading. */
export function section(text: string, prefix: string): string {
  const start = text.indexOf(`\n## ${prefix}`);
  if (start < 0) throw new Error(`no section "## ${prefix}"`);
  const end = text.indexOf('\n## ', start + 1);
  return text.slice(start, end < 0 ? undefined : end);
}

/** The first Markdown table in `text`: its header cells and its rows. Backticks are stripped from cells. */
export function table(text: string): { header: string[]; rows: string[][] } {
  const lines = text.split('\n');
  const first = lines.findIndex((l) => l.trimStart().startsWith('|'));
  if (first < 0) throw new Error('no table');
  const block: string[] = [];
  for (const l of lines.slice(first)) {
    if (!l.trimStart().startsWith('|')) break;
    block.push(l);
  }
  const cells = (l: string) =>
    l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/`/g, ''));
  return { header: cells(block[0]), rows: block.slice(2).map(cells) };
}
