import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;

describe('token discipline', () => {
  it('no hex colour literal appears in src/components, src/pages or src/layouts', () => {
    const offenders: string[] = [];
    for (const f of [...files('src/components'), ...files('src/pages'), ...files('src/layouts')]) {
      const text = readFileSync(f, 'utf8')
        .replace(/href="#[^"]*"/g, '') // in-page anchors
        .replace(/url\(#[^)]*\)/g, ''); // SVG paint-server references
      for (const m of text.matchAll(HEX)) offenders.push(`${f}: ${m[0]}`);
    }
    expect(offenders).toEqual([]);
  });
});
