import { describe, it, expect } from 'vitest';
import { layoutProblems, refuse, SECTIONS } from '../../scripts/troupe-docs-lib.mjs';

// Only .md pages directly inside the six sections are built (spec: versioned-docs; design D4).
describe('layoutProblems', () => {
  it('accepts a .md page directly inside each of the six sections', () => {
    expect(layoutProblems(SECTIONS.map((s: string) => `${s}/page.md`))).toEqual([]);
  });

  it('refuses an MDX page, saying only .md pages are accepted', () => {
    expect(layoutProblems(['stagecraft/demo.mdx'])).toEqual(['docs/stagecraft/demo.mdx: only .md pages are accepted']);
  });

  it('refuses a stray file that is not a page', () => {
    expect(layoutProblems(['the-company/diagram.png'])).toEqual(['docs/the-company/diagram.png: only .md pages are accepted']);
  });

  it('refuses a seventh section, naming the six', () => {
    expect(layoutProblems(['appendix/notes.md'])).toEqual([
      'docs/appendix/notes.md: a page goes in one of the six sections: programme, opening-night, the-company, stagecraft, prompt-book, backstage',
    ]);
  });

  it('refuses a page at the top of docs/, outside every section', () => {
    expect(layoutProblems(['index.md'])[0]).toMatch(/^docs\/index\.md: a page goes in one of the six sections/);
  });

  it('refuses a page in a folder inside a section', () => {
    expect(layoutProblems(['stagecraft/deep/page.md'])).toEqual([
      'docs/stagecraft/deep/page.md: a page sits directly in its section, not in a folder inside it',
    ]);
  });
});

describe('refuse', () => {
  it('names the version and every problem', () => {
    expect(() => refuse({ ref: 'troupe-v0.1.1' }, ['docs/a.mdx: x', 'docs/b: y'])).toThrow(
    "troupe-v0.1.1 can't be built into /docs:\n  - docs/a.mdx: x\n  - docs/b: y");
  });

  it("names troupe's main by name, not as a bare ref", () => {
    expect(() => refuse({ ref: 'main' }, ['p'])).toThrow("troupe's main can't be built into /docs");
  });

  it('does nothing when there are no problems', () => {
    expect(() => refuse({ ref: 'main' }, [])).not.toThrow();
  });
});
