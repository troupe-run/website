import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pngSize, hashFiles, verify, outputPaths } from '../../scripts/assets-lib.mjs';

// 1×1 transparent PNG
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'assets-'));
  mkdirSync(join(root, 'brand/out'), { recursive: true });
  mkdirSync(join(root, 'public'), { recursive: true });
  writeFileSync(join(root, 'brand/a.svg'), '<svg/>');
  writeFileSync(join(root, 'public/a.svg'), '<svg/>');
  writeFileSync(join(root, 'brand/out/x.png'), PNG_1x1);
  writeFileSync(join(root, 'public/x.ico'), 'ico-bytes');
  const config = {
    SOURCES: ['brand/a.svg'],
    ASSETS: [{ template: 't.html', out: 'brand/out/x.png', width: 1, height: 1 }],
    COPIES: [{ from: 'brand/a.svg', to: 'public/a.svg' }],
    ICO: { from: 'brand/out/x.png', to: 'public/x.ico' },
  };
  writeFileSync(
    join(root, 'brand/out/manifest.json'),
    JSON.stringify({
      sources: hashFiles(config.SOURCES, root),
      outputs: hashFiles(outputPaths(config), root),
    }),
  );
  return { root, config };
}

describe('assets-lib', () => {
  it('pngSize reads width and height from the IHDR chunk', () => {
    expect(pngSize(PNG_1x1)).toEqual({ width: 1, height: 1 });
  });
  it('verify returns no problems when outputs and the manifest match', () => {
    const { root, config } = fixture();
    expect(verify(root, config)).toEqual([]);
  });
  it('verify reports a source that changed since the last render', () => {
    const { root, config } = fixture();
    writeFileSync(join(root, 'brand/a.svg'), '<svg id="changed"/>');
    expect(verify(root, config)).toEqual([
      'brand/a.svg changed since last render: run npm run assets:render',
      'public/a.svg differs from brand/a.svg: run npm run assets:render', // the copy is now stale too
    ]);
  });
  it('verify reports a missing output', () => {
    const { root, config } = fixture();
    config.ASSETS.push({ template: 't.html', out: 'brand/out/missing.png', width: 1, height: 1 });
    expect(verify(root, config)).toEqual(['brand/out/missing.png is missing']);
  });
  it('verify reports an output with the wrong size', () => {
    const { root, config } = fixture();
    config.ASSETS[0].width = 2;
    expect(verify(root, config)).toEqual(['brand/out/x.png is 1×1, expected 2×1']);
  });
  it('verify reports a missing manifest', () => {
    const { root, config } = fixture();
    rmSync(join(root, 'brand/out/manifest.json'));
    expect(verify(root, config)).toEqual(['brand/out/manifest.json is missing: run npm run assets:render']);
  });
  it('verify reports a source added to SOURCES after the last render (e.g. the config file itself)', () => {
    const { root, config } = fixture();
    writeFileSync(join(root, 'brand/b.json'), '{}');
    config.SOURCES.push('brand/b.json');
    expect(verify(root, config)).toEqual(['brand/b.json changed since last render: run npm run assets:render']);
  });
  it('verify reports an output whose bytes changed but whose size is still right', () => {
    const { root, config } = fixture();
    const other = Buffer.from(PNG_1x1);
    other[other.length - 20] ^= 0xff; // flip a byte in the IDAT/CRC area; IHDR size stays 1×1
    writeFileSync(join(root, 'brand/out/x.png'), other);
    expect(verify(root, config)).toEqual([
      'brand/out/x.png differs from the rendered version recorded in the manifest: run npm run assets:render',
    ]);
  });
  it('verify reports a copy whose content differs from its source', () => {
    const { root, config } = fixture();
    writeFileSync(join(root, 'public/a.svg'), '<svg id="stale"/>');
    expect(verify(root, config)).toEqual([
      'public/a.svg differs from brand/a.svg: run npm run assets:render',
      'public/a.svg differs from the rendered version recorded in the manifest: run npm run assets:render',
    ]);
  });
  it('verify reports a missing copy', () => {
    const { root, config } = fixture();
    rmSync(join(root, 'public/a.svg'));
    expect(verify(root, config)).toEqual(['public/a.svg is missing']);
  });
  it('verify reports a missing ICO, resolved against the root', () => {
    const { root, config } = fixture();
    rmSync(join(root, 'public/x.ico'));
    expect(verify(root, config)).toEqual(['public/x.ico is missing']);
  });
  it('verify reports an ICO whose bytes changed since the render', () => {
    const { root, config } = fixture();
    writeFileSync(join(root, 'public/x.ico'), 'other-bytes');
    expect(verify(root, config)).toEqual([
      'public/x.ico differs from the rendered version recorded in the manifest: run npm run assets:render',
    ]);
  });
  it('verify treats an old manifest with no recorded outputs as drift', () => {
    const { root, config } = fixture();
    writeFileSync(join(root, 'brand/out/manifest.json'), JSON.stringify({ sources: hashFiles(config.SOURCES, root) }));
    expect(verify(root, config)).toHaveLength(3);
  });
});
