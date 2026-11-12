import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Each project is a Markdown file in src/content/projects/. The body is the long walkthrough
// shown on /projects/<slug>. Frontmatter drives the card on the home page.
const compareRow = z.object({
  label: z.string(),
  before: z.number(),
  after: z.number(),
  max: z.number().optional(), // bar scale; defaults to 100 for % rows, otherwise the larger value
  note: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    repo: z.string().optional(), // GitHub repo name under aseem1504
    problem: z.string(),
    built: z.string(),
    result: z.string(),
    tags: z.array(z.string()),
    steps: z.array(z.object({ label: z.string(), sub: z.string().optional() })).default([]),
    // One result visual: a before/after comparison, or a map drawn from real demo output.
    visual: z
      .object({
        kind: z.enum(['compare', 'map-toll', 'map-india']),
        caption: z.string(),
        unit: z.string().default(''),
        beforeLabel: z.string().optional(),
        afterLabel: z.string().optional(),
        rows: z.array(compareRow).optional(),
      })
      .optional(),
    workLink: z.string().optional(), // sentence linking the project to the WheelsEye story
    inProgress: z.boolean().default(false),
  }),
});

// Poems. Hidden on the site until at least one exists.
const poems = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/poems' }),
  schema: z.object({
    title: z.string(),
    lang: z.enum(['hi', 'en']),
    english: z.string().optional(), // optional English line under a Hindi title
    order: z.number().default(0),
  }),
});

export const collections = { projects, poems };
