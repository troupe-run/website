// The GitHub Apps' avatars (spec: app-avatars). The brand guide's §5 "GitHub Apps" table is the list of Apps and
// each one's kind; these check the sources in brand/apps/ and APPS in assets.config.mjs against it.

const GUIDE = 'docs/brand-guide.md';
const HEAD = { system: '#FF5A3C', agent: '#14857D' };
const SHARED = ['#FFFFFF', '#1D1B2F', '#FFC93C']; // eyes, ink and sunflower
const SHAPES = ['path', 'circle', 'rect', 'ellipse', 'polygon', 'polyline', 'line'];
const NOT_FLAT = 'an App avatar is flat, with no gradient, filter, mask or opacity';

/** The rows of §5's "GitHub Apps" table, as { app, kind, prop }. Throws on a missing table or an unknown kind. */
export function readAppTable(guide) {
  const text = `\n${guide}`;
  const start = text.indexOf('\n## 5.');
  if (start < 0) throw new Error(`${GUIDE} has no "## 5." section`);
  const end = text.indexOf('\n## ', start + 1);
  const s5 = text.slice(start, end < 0 ? undefined : end);
  const at = s5.indexOf('\n### GitHub Apps');
  if (at < 0) throw new Error(`${GUIDE} §5 has no "### GitHub Apps" subsection`);
  const lines = s5.slice(at).split('\n');
  const first = lines.findIndex((l) => l.startsWith('|'));
  const block = [];
  for (const l of lines.slice(first)) {
    if (!l.startsWith('|')) break;
    block.push(l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/`/g, '')));
  }
  const where = `${GUIDE} §5 "GitHub Apps"`;
  if (block[0]?.join(' | ') !== 'App | Kind | Prop') {
    throw new Error(`${where}: the table's columns are ${block[0]?.join(' | ')}, expected App | Kind | Prop`);
  }
  return block.slice(2).map(([app, kind, prop]) => {
    if (!(kind in HEAD)) throw new Error(`${where}: ${app} has kind "${kind}"; the kind is system or agent`);
    return { app, kind, prop };
  });
}

/** Problems with one App's source SVG: any colour outside its kind's palette, or anything that isn't flat. */
export function checkSource(name, kind, svg) {
  const problems = [];
  const palette = [HEAD[kind], ...SHARED];
  const reported = new Set();
  for (const m of svg.matchAll(/<(linearGradient|radialGradient|filter|mask|style)\b/g)) problems.push(`${name} has a <${m[1]}>: ${NOT_FLAT}`);
  for (const m of svg.matchAll(/\s((?:fill-|stroke-)?opacity)="([^"]*)"/g)) problems.push(`${name} has ${m[1]}="${m[2]}": ${NOT_FLAT}`);
  for (const m of svg.matchAll(/\s(fill|stroke|stop-color|color)="([^"]*)"/g)) {
    const value = m[2];
    if (value === 'none') continue;
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
      problems.push(`${name} gives a colour as ${m[1]}="${value}", which the check can't read: use a six-digit hex`);
      continue;
    }
    const hex = value.toUpperCase();
    if (!palette.includes(hex) && !reported.has(hex)) {
      reported.add(hex);
      problems.push(`${name} uses ${hex}, which isn't in ${kind === 'agent' ? 'an agent' : 'a system'} App's colours (${palette.join(', ')})`);
    }
  }
  for (const m of svg.matchAll(/\sstyle="([^"]*)"/g)) {
    problems.push(`${name} has a style attribute (style="${m[1]}"), which the check can't read: use fill and stroke attributes`);
  }
  // Each shape carries its own fill, so nothing relies on inheritance or on SVG's default black.
  for (const m of svg.matchAll(new RegExp(`<(${SHAPES.join('|')})\\b([^>]*)>`, 'g'))) {
    const attr = (a) => m[2].match(new RegExp(`\\s${a}="([^"]*)"`))?.[1];
    const fill = attr('fill');
    const stroke = attr('stroke');
    if (fill === undefined) {
      problems.push(`${name} has a <${m[1]}> with no fill, which draws black: give every shape its own fill`);
    } else if (stroke !== undefined && stroke !== 'none' && fill !== 'none' && stroke.toUpperCase() !== fill.toUpperCase()) {
      problems.push(`${name} has a <${m[1]}> with stroke ${stroke} on fill ${fill}, an outline: give the stroke its fill's colour, or fill="none" for a line`);
    }
  }
  return problems;
}

/** Problems with the set of Apps: each guide App needs a source and an APPS entry, and nothing else may have one. */
export function checkAppSet({ guide, sources, apps }) {
  const problems = [];
  for (const app of guide) {
    if (!sources.includes(app)) problems.push(`${app} is in the brand guide but has no source: draw brand/apps/${app}.svg`);
    if (!apps.includes(app)) problems.push(`${app} is in the brand guide but not in APPS in scripts/assets.config.mjs, so it has no avatar`);
  }
  for (const app of sources.filter((a) => !guide.includes(a))) {
    problems.push(`brand/apps/${app}.svg is for an App the brand guide's §5 doesn't list`);
  }
  for (const app of apps.filter((a) => !guide.includes(a))) {
    problems.push(`APPS in scripts/assets.config.mjs lists ${app}, which the brand guide's §5 doesn't list`);
  }
  return problems;
}
