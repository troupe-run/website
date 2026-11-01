// troupe-run's GitHub Apps, as the brand guide's §5 lists them (spec: app-avatars). Each has brand/apps/<app>.svg.
export const APPS = [
  'troupe-run-release', 'troupe-run-review', 'troupe-run-dependabot', 'troupe-run-infrastructure',
  'troupe-run-docs', 'troupe-run-dispatch', 'troupe-run-board',
];
export const ASSETS = [
  { template: 'preview.html', query: 'tag=Your%20agents%20need%20a%20director.&size=76&measure=26', out: 'public/og.png', width: 1200, height: 630 },
  { template: 'icon.html', query: 'size=32&bg=none', out: 'brand/out/favicon-32.png', width: 32, height: 32, transparent: true },
  { template: 'icon.html', query: 'size=180&bg=cream', out: 'public/apple-touch-icon.png', width: 180, height: 180 },
  { template: 'github-avatar.html', out: 'brand/out/github-avatar.png', width: 500, height: 500 },
  { template: 'preview.html', query: 'tag=Your%20agents%20need%20a%20director.&size=76&measure=26', out: 'brand/out/repo-preview.png', width: 1280, height: 640 },
  { template: 'readme-banner.html', out: 'brand/out/readme-banner.png', width: 1280, height: 320 },
  { template: 'lockup.html', query: 'theme=light', out: 'brand/out/lockup-light.png', width: 640, height: 160, transparent: true },
  { template: 'lockup.html', query: 'theme=dark', out: 'brand/out/lockup-dark.png', width: 640, height: 160, transparent: true },
  ...APPS.map((app) => ({ template: 'app-avatar.html', query: `app=${app}`, out: `brand/out/app-${app}.png`, width: 500, height: 500 })),
];
export const COPIES = [
  { from: 'brand/favicon.svg', to: 'public/favicon.svg' },
];
export const ICO = { from: 'brand/out/favicon-32.png', to: 'public/favicon.ico' };
export const SOURCES = [
  'scripts/assets.config.mjs', 'brand/favicon.svg', 'brand/mark.svg', 'brand/templates/base.css',
  ...[...new Set(ASSETS.map((a) => a.template))].map((t) => `brand/templates/${t}`),
  ...APPS.map((app) => `brand/apps/${app}.svg`),
];
