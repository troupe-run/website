import { describe, it, expect } from 'vitest';
import { readRoadmap } from '../../scripts/roadmap-lib.mjs';

// The release list on /status/, from troupe-run/infrastructure's tofu/milestones.json and troupe's release tags
// (spec: roadmap; design D2 to D4). Release tags come with their dates, as the docs manifest records them.
const file = (milestones: unknown[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ repositories: ['troupe'], milestones, ...extra });
const m = (title: string, description = `${title}: what it adds`, more: Record<string, unknown> = {}) => ({
  key: title,
  title,
  state: 'open',
  description,
  ...more,
});
const versions = (r: { releases: { version: string }[] }) => r.releases.map((x) => x.version);
const tag = (name: string, date = '2026-11-05T10:00:00+10:00') => ({ tag: name, date });

describe('readRoadmap: order', () => {
  it('lists every milestone by version compared as numbers, whatever order the file has, with 1.0.0 last', () => {
    const r = readRoadmap(file([m('1.0.0'), m('0.10.0'), m('0.2.0'), m('0.1.0')]), []);
    expect(versions(r)).toEqual(['0.1.0', '0.2.0', '0.10.0', '1.0.0']);
  });

  it("keeps each description word for word, and only the version and description of each", () => {
    const r = readRoadmap(file([m('0.1.0', 'One real actor, safely: an actor defined in config runs')]), []);
    expect(r.releases).toEqual([
      { version: '0.1.0', description: 'One real actor, safely: an actor defined in config runs', released: null },
    ]);
  });
});

describe('readRoadmap: released, with the date of its tag', () => {
  const plan = file([m('0.1.0'), m('0.2.0'), m('0.3.0')]);

  it('with no release tags, dates nothing and has no latest release', () => {
    const r = readRoadmap(plan, []);
    expect(r.releases.map((x) => x.released)).toEqual([null, null, null]);
    expect(r.latest).toBeNull();
  });

  it("dates a milestone by its exact tag's day, as YYYY-MM-DD in the tag's own time zone, and leaves the rest undated", () => {
    const r = readRoadmap(plan, [tag('troupe-v0.1.0', '2026-11-05T23:30:00+10:00')]);
    expect(r.releases.map((x) => x.released)).toEqual(['2026-11-05', null, null]);
    expect(r.latest).toBe('0.1.0');
  });

  it('adds no entry for a patch tag no milestone declares, and names the highest tag as the latest release', () => {
    const r = readRoadmap(plan, [tag('troupe-v0.1.0'), tag('troupe-v0.1.1'), tag('troupe-v0.2.0')]);
    expect(versions(r)).toEqual(['0.1.0', '0.2.0', '0.3.0']);
    expect(r.latest).toBe('0.2.0');
  });

  it('compares tags as numbers for the latest release', () => {
    expect(readRoadmap(plan, [tag('troupe-v0.10.0'), tag('troupe-v0.9.0')]).latest).toBe('0.10.0');
  });

  it('marks nothing as current or in progress: a release is only dated or not', () => {
    const r = readRoadmap(plan, [tag('troupe-v0.1.0')]);
    expect(Object.keys(r).sort()).toEqual(['latest', 'releases']);
    expect(r.releases.map((x) => Object.keys(x).sort())).toEqual(Array(3).fill(['description', 'released', 'version']));
  });

  it("ignores a milestone's state: a closed milestone with no tag isn't released, an open one with a tag is", () => {
    const r = readRoadmap(file([m('0.1.0', 'a: b', { state: 'closed' }), m('0.2.0')]), [tag('troupe-v0.2.0')]);
    expect(r.releases.map((x) => x.released)).toEqual([null, '2026-11-05']);
  });

  it("ignores tags that aren't troupe's releases", () => {
    expect(readRoadmap(plan, [tag('v0.1.0'), tag('website-v0.1.0')]).latest).toBeNull();
  });

  it("refuses a release tag's date that isn't an ISO date, naming the tag", () => {
    expect(() => readRoadmap(plan, [tag('troupe-v0.1.0', 'yesterday')])).toThrow(/^troupe-v0\.1\.0's date "yesterday" isn't a date/);
  });
});

describe('readRoadmap: what it ignores', () => {
  it('ignores key, state, repositories and keys it has never seen, on a milestone or the file', () => {
    const r = readRoadmap(file([m('0.1.0', 'a: b', { due_on: '2027-01-01', colour: 'red' })], { owner: 'x' }), []);
    expect(r.releases).toEqual([{ version: '0.1.0', description: 'a: b', released: null }]);
  });
});

describe('readRoadmap: refusals name tofu/milestones.json, the milestone and the fix', () => {
  const refuses = (text: string, pattern: RegExp) => expect(() => readRoadmap(text, [])).toThrow(pattern);

  it("refuses a file that isn't JSON", () => {
    refuses('{"milestones": [', /^tofu\/milestones\.json isn't JSON: .+\nFix: /s);
  });

  it('refuses a file with no milestones list', () => {
    refuses('{}', /^tofu\/milestones\.json has no `milestones` list\.\nFix: /);
    refuses('{"milestones": {}}', /^tofu\/milestones\.json has no `milestones` list\./);
    refuses('[]', /^tofu\/milestones\.json has no `milestones` list\./);
  });

  it("refuses a milestone that isn't an object, naming its place in the list", () => {
    refuses(file([m('0.1.0'), '0.2.0']), /^tofu\/milestones\.json: milestone 2 isn't an object\.\nFix: /);
  });

  it.each(['v0.3', '0.3', '0.03.0', '0.3.0-rc.1', ' 0.3.0', ''])("refuses the title %j, naming it and the form", (title) => {
    refuses(
      file([m('0.1.0'), m(title)]),
      new RegExp(`^tofu/milestones\\.json: milestone 2's title ${JSON.stringify(title).replace(/[.]/g, '\\.')} isn't a version\\.\\nFix: .*MAJOR\\.MINOR\\.PATCH`, 's'),
    );
  });

  it('refuses a title that is missing or not a string', () => {
    refuses(file([{ description: 'a: b' }]), /^tofu\/milestones\.json: milestone 1's title undefined isn't a version\./);
    refuses(file([{ title: 3, description: 'a: b' }]), /^tofu\/milestones\.json: milestone 1's title 3 isn't a version\./);
  });

  it('refuses a missing, empty or blank description, naming the milestone', () => {
    refuses(file([{ title: '0.4.0' }]), /^tofu\/milestones\.json: 0\.4\.0 has no description\.\nFix: /);
    refuses(file([m('0.4.0', '')]), /^tofu\/milestones\.json: 0\.4\.0 has no description\./);
    refuses(file([m('0.4.0', '   ')]), /^tofu\/milestones\.json: 0\.4\.0 has no description\./);
  });

  it('refuses two milestones with one title, naming it', () => {
    refuses(file([m('0.4.0'), m('0.5.0'), m('0.4.0')]), /^tofu\/milestones\.json: two milestones are titled 0\.4\.0\.\nFix: /);
  });
});
