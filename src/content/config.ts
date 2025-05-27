import { defineCollection, z } from "astro:content";

const albums = defineCollection({
  type: "data",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      cover: image(),

    }),
});

// const blog = defineCollection({
//     type: ""
// })

export const collections = {
  albums,
};