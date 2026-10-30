import { getAlbums } from "./content";
import { getPhotos } from "./photos";
import { buildStats } from "../lib/stats";

export async function getStats() {
  const [photos, albums] = await Promise.all([getPhotos(), getAlbums()]);
  return buildStats(
    photos,
    Object.fromEntries(albums.map((album) => [album.id, album.data.title])),
  );
}
