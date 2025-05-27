import { defineCollection, z } from "astro:content";

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

// const blog = defineCollection({
//     type: ""
// })

export const collections = {
  albums,
};