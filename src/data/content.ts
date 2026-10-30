import { getCollection } from "astro:content";

export async function getPublishedPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getAlbums() {
  const albums = await getCollection("albums");
  return albums.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
