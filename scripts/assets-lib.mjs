import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function pngSize(buf) {
  if (buf.readUInt32BE(12) !== 0x49484452) throw new Error('not a PNG (no IHDR)');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export function hashFiles(paths, root) {
  return Object.fromEntries(
    paths.map((p) => [
      p,
      createHash('sha256')
        .update(readFileSync(join(root, p)))
        .digest('hex'),
    ]),
  );
}

// Every file the render step writes, so verify() can tell a hand-edited or stale output from a rendered one.
export function outputPaths(config) {
  return [
    ...config.ASSETS.map((a) => a.out),
    ...config.COPIES.map((c) => c.to),
    ...(config.ICO ? [config.ICO.to] : []),
  ];
}

export function verify(root, config) {
  const problems = [];
  const manifestPath = join(root, 'brand/out/manifest.json');
  if (!existsSync(manifestPath)) return ['brand/out/manifest.json is missing: run npm run assets:render'];
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const recordedSources = manifest.sources ?? {};
  const recordedOutputs = manifest.outputs ?? {};
  for (const [p, h] of Object.entries(hashFiles(config.SOURCES, root))) {
    if (recordedSources[p] !== h) problems.push(`${p} changed since last render: run npm run assets:render`);
  }
  for (const a of config.ASSETS) {
    const out = join(root, a.out);
    if (!existsSync(out)) {
      problems.push(`${a.out} is missing`);
      continue;
    }
    const { width, height } = pngSize(readFileSync(out));
    if (width !== a.width || height !== a.height)
      problems.push(`${a.out} is ${width}×${height}, expected ${a.width}×${a.height}`);
  }
  for (const c of config.COPIES) {
    if (!existsSync(join(root, c.to))) {
      problems.push(`${c.to} is missing`);
      continue;
    }
    if (!readFileSync(join(root, c.from)).equals(readFileSync(join(root, c.to)))) {
      problems.push(`${c.to} differs from ${c.from}: run npm run assets:render`);
    }
  }
  if (config.ICO && !existsSync(join(root, config.ICO.to))) problems.push(`${config.ICO.to} is missing`);
  for (const p of outputPaths(config)) {
    if (!existsSync(join(root, p))) continue; // already reported as missing
    const h = hashFiles([p], root)[p];
    if (recordedOutputs[p] !== h)
      problems.push(`${p} differs from the rendered version recorded in the manifest: run npm run assets:render`);
  }
  return problems;
}
