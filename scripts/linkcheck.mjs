// Internal link check over a built site. Wraps linkinator and refuses to pass when it scanned nothing
// (a bad --skip pattern once made the gate pass on 0 links). Then checks every reference in /protocol/'s schemas,
// which linkinator doesn't read (spec: protocol-schemas; design D7).
import { runLinkinator, summarise } from './linkinator-lib.mjs';
import { checkReferences, referenceProblems } from './protocol-lib.mjs';

const dir = process.argv[2] ?? 'dist';
// Skip every external URL, but not linkinator's own local server root.
const skip = '^https?://(?!(localhost|127\\.0\\.0\\.1)[:/])';
const run = runLinkinator(dir, [skip]);
if (run.error) {
  console.error(run.stdout, run.stderr);
  console.error(`✗ ${run.error}`);
  process.exit(1);
}
const { links, scanned, broken } = summarise(run.result);
console.log(`Scanned ${scanned.length} links in ${dir} (${links.length - scanned.length} skipped)`);
for (const l of broken) console.error(`✗ ${l.status} ${l.url} (from ${l.parent})`);
if (scanned.length < 2) { console.error('✗ scanned fewer than 2 links (root only or nothing): the link check is not checking anything'); process.exit(1); }
if (broken.length) { console.error(`✗ ${broken.length} broken link(s)`); process.exit(1); }
console.log('✓ no broken internal links');

const references = checkReferences(dir);
console.log(`Checked ${references.checked} schema references in ${dir}/protocol (${references.skipped} outside troupe.run skipped)`);
const problems = referenceProblems(references);
for (const p of problems) console.error(`✗ ${p}`);
if (problems.length) { console.error(`✗ ${references.broken.length} broken schema reference(s)`); process.exit(1); }
console.log('✓ no broken schema references');
