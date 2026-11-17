// Types for `tsc --noEmit` (spec: quality-check; lint-gates design D4). Astro's own checker understands `.astro`
// files and Astro's generated types; tsc needs them declared. `astro check` still checks the components themselves.
/// <reference types="astro/client" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- an ambient declaration file has no import to use.
/// <reference path="../node_modules/starlight-blog/virtual.d.ts" />

declare module '*.astro' {
  const Component: import('astro/runtime/server/index.js').AstroComponentFactory;
  export default Component;
}
