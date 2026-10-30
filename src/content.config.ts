import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const albums = defineCollection({
  loader: glob({
    pattern: "**/*.yaml",
    base: "./src/content/albums",
    generateId: ({ entry }) => entry.replace(/\.yaml$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    essay: z.string().optional(),
    showDate: z.boolean().default(true),
    cover: z.string(),
    date: z.coerce.date(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      description: z.string().optional(),
      draft: z.boolean().optional(),
      cover: image().optional(),
      tags: z.array(z.string()).optional(),
    }),
});

export const collections = {
  albums,
  blog,
};
