import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { blogSchema } from 'starlight-blog/schema';

const link = z.object({ label: z.string(), href: z.string() });
const cta = z.object({ label: z.string(), href: z.string().optional() });
import { TOPIC_ICONS } from './lib/topic-icons';

const copySchema = z.discriminatedUnion('section', [
  z.object({ section: z.literal('header'), nav: z.array(link).min(1) }),
  z.object({
    section: z.literal('hero'),
    title: z.string(), subtitle: z.string(),
    primary: cta.extend({ href: z.string().url() }), secondary: cta,
  }),
  z.object({
    section: z.literal('how'),
    eyebrow: z.string(), title: z.string(), intro: z.string(), loop: z.string(),
    steps: z.array(z.object({ label: z.string(), title: z.string(), body: z.string() })).length(4),
  }),
  z.object({
    section: z.literal('cast'),
    eyebrow: z.string(), title: z.string(), body: z.string(),
    rows: z.array(z.object({ role: z.string(), holder: z.string(), kind: z.enum(['human', 'agent']) })).length(4),
    gate: z.string(), note: z.string(),
  }),
  z.object({
    section: z.literal('principles'),
    eyebrow: z.string(), title: z.string(), intro: z.string(),
    items: z.array(z.object({ icon: z.enum(TOPIC_ICONS), title: z.string(), body: z.string() })).length(6),
  }),
  z.object({
    section: z.literal('closing'),
    title: z.string(), body: z.string(), cta: cta.extend({ href: z.string().url() }),
  }),
  z.object({
    section: z.literal('versions'),
    menu: z.string(), latest: z.string(), unreleased: z.string(), next: z.string(),
    archived: z.string().includes('{version}').includes('{latest}'),
    nextBanner: z.string().includes('{latest}'),
    samePage: z.string().includes('{latest}'), startPage: z.string().includes('{latest}'),
    viewSource: z.string(),
  }),
  z.object({
    section: z.literal('footer'),
    attribution: z.string(), copyright: z.string(),
    links: z.array(link),
  }),
]);

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: (context) => blogSchema(context).extend({
        status: z.enum(['written', 'planned']).default('planned'),
        prerelease: z.boolean().default(true),
        purpose: z.string().optional(),
      }),
    }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  copy: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/copy' }), schema: copySchema }),
};
