import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const albums = defineCollection({
  type: "data",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      cover: image(),
      images: z.array(z.object({
        src: image(),
        caption: z.string().optional(),
      })).optional()

    }),
});

const blog = defineCollection({
  loader: glob({pattern: "**/*.md", base: "./src/content/blog"}),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    draft: z.boolean().optional(),
  })});

export const collections = {
  albums, blog
};