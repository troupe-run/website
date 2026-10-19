import { describe, it, expect } from 'vitest';
import { parseFrontMatter, frontMatterProblems, TroupeDocsError } from '../../scripts/troupe-docs-lib.mjs';

// The site reads a page's front matter as troupe's docs check does (spec: versioned-docs; design D4). Each case
// here is one of troupe-run/troupe's, from packages/troupe/tests/test_user_docs_front_matter.py on main
// (2026-10-19), with the same input and the same message, so the two readers can't quietly disagree.
const WRITTEN = (extra: string, body: string) =>
  `---\ntitle: Theatres\ndescription: What a theatre is.\nstatus: written\n${extra}---\n\n${body}`;
const problems = (text: string) => {
  const { front, body } = parseFrontMatter(text);
  return frontMatterProblems(front, body);
};

describe('frontMatterProblems, as troupe has them', () => {
  it('names description when a page has a title and no description', () => {
    expect(problems('---\ntitle: Theatres\nstatus: planned\npurpose: What.\n---\n')).toEqual([
      '`description` is missing or empty; give the page a description',
    ]);
  });

  it('names an unknown key with the keys that are allowed', () => {
    expect(problems(WRITTEN('prerelease: false\nstaus: x\n', 'Hi.'))).toEqual([
      "`staus` isn't a front-matter key; the keys allowed are title, description, status, prerelease, purpose",
    ]);
  });

  it('says to write a planned page that has text, or remove the body', () => {
    expect(problems('---\ntitle: T\ndescription: D.\nstatus: planned\npurpose: P.\n---\n\nSome text.\n')).toEqual([
      'a planned page has no body: set `status: written`, or remove the body',
    ]);
  });

  it('says what to set when a written page leaves prerelease out', () => {
    expect(problems(WRITTEN('', 'Hi.\n'))).toEqual([
      "a written page sets `prerelease`: `true` if it describes behaviour troupe doesn't have yet, `false` otherwise",
    ]);
  });

  it('needs a purpose on a planned page', () => {
    expect(problems('---\ntitle: T\ndescription: D.\nstatus: planned\n---\n')).toEqual([
      'a planned page needs a `purpose`: the line its placeholder shows',
    ]);
  });

  it('needs prerelease to be true or false', () => {
    expect(problems(WRITTEN('prerelease: "no"\n', 'Hi.'))).toEqual(['`prerelease` must be true or false']);
  });

  it('needs a body on a written page', () => {
    expect(problems(WRITTEN('prerelease: false\n', ''))).toEqual([
      'a written page needs a body, or `status: planned` and a `purpose`',
    ]);
  });

  it("names a status that isn't written or planned", () => {
    expect(problems('---\ntitle: T\ndescription: D.\nstatus: draft\n---\n')).toEqual([
      "`status` must be `written` or `planned`, not 'draft'",
    ]);
  });

  it('accepts a written page with every key set', () => {
    expect(problems(WRITTEN('prerelease: true\n', 'Hi.'))).toEqual([]);
  });
});

describe('parseFrontMatter, as troupe has it', () => {
  it("reads the website's quoted purpose as the site reads it", () => {
    const { front, body } = parseFrontMatter(
      '---\ntitle: Read the lineage\ndescription: Following the record.\nstatus: planned\n' +
        'purpose: "Answering \\"who decided this?\\" from the lineage."\n---\n',
    );
    expect(front.purpose).toBe('Answering "who decided this?" from the lineage.');
    expect(body).toBe('');
  });

  it('refuses a key set twice', () => {
    expect(() => parseFrontMatter('---\ntitle: A\ntitle: B\n---\n')).toThrow('`title` is set twice; keep one');
  });

  it.each([
    ['colon', 'Flows: fork, join'],
    ['flow-list', '[a, b]'],
    ['yaml-bool', 'yes'],
    ['number', '12'],
    ['comment', 'a # comment'],
    ['bad-single-quote', "'it's'"],
  ])('refuses a value YAML would read differently (%s), saying how to quote it', (_, value) => {
    expect(() => parseFrontMatter(`---\ntitle: ${value}\n---\n`)).toThrow('quote it with double quotes');
  });

  it('refuses a page without front matter', () => {
    expect(() => parseFrontMatter('# Theatres\n')).toThrow('put `---` on its first line');
  });

  it('refuses front matter with no closing line', () => {
    expect(() => parseFrontMatter('---\ntitle: T\n')).toThrow('the front matter has no closing `---` line');
  });

  it('reads CRLF line endings the same', () => {
    const text = '---\ntitle: T\ndescription: D.\nstatus: planned\npurpose: P.\n---\n';
    expect(parseFrontMatter(text.replace(/\n/g, '\r\n'))).toEqual(parseFrontMatter(text));
  });

  it("reads single-quoted strings with YAML's doubled quote, and true and false as booleans", () => {
    const { front } = parseFrontMatter("---\ntitle: 'It''s here'\nprerelease: false\n---\n");
    expect(front).toEqual({ title: "It's here", prerelease: false });
  });

  it('throws its own error type, so the sync can add the version and page', () => {
    expect(() => parseFrontMatter('x')).toThrow(TroupeDocsError);
  });
});
