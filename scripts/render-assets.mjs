import { chromium } from '@playwright/test';
import { copyFileSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import pngToIco from 'png-to-ico';
import { ASSETS, COPIES, ICO, SOURCES } from './assets.config.mjs';
import { hashFiles, outputPaths } from './assets-lib.mjs';

const root = process.cwd();
const browser = await chromium.launch();
try {
  for (const a of ASSETS) {
    const page = await browser.newPage({ viewport: { width: a.width, height: a.height }, deviceScaleFactor: 1 });
    const url = pathToFileURL(resolve(root, 'brand/templates', a.template)).href + (a.query ? `?${a.query}` : '');
    await page.goto(url);
    // eslint-disable-next-line no-undef -- runs in the page, where `document` exists.
    await page.evaluate(() => document.fonts.ready);
    mkdirSync(dirname(resolve(root, a.out)), { recursive: true });
    await page.screenshot({ path: resolve(root, a.out), omitBackground: !!a.transparent });
    await page.close();
    console.log(`rendered ${a.out}`);
  }
} finally {
  await browser.close();
}
for (const c of COPIES) copyFileSync(resolve(root, c.from), resolve(root, c.to));
writeFileSync(resolve(root, ICO.to), await pngToIco([readFileSync(resolve(root, ICO.from))]));
writeFileSync(
  resolve(root, 'brand/out/manifest.json'),
  JSON.stringify(
    { sources: hashFiles(SOURCES, root), outputs: hashFiles(outputPaths({ ASSETS, COPIES, ICO }), root) },
    null,
    2,
  ) + '\n',
);
console.log('wrote brand/out/manifest.json');
