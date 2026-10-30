import { v2 as cloudinary } from "cloudinary";
import { z } from "astro/zod";
import { createAsyncCache } from "../lib/async-cache.ts";

// Replaced at compile time. Only astro.config.fixture.mjs enables fixture data.
declare const __PHOTO_CATALOG_FIXTURE__: boolean;

const contextFields = z.object({ caption: z.string().optional(), alt: z.string().optional() });
const resourceSchema = z.object({
  public_id: z.string().min(1),
  resource_type: z.literal("image"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().min(1),
  created_at: z.iso.datetime({ offset: true }),
  asset_folder: z.string().optional(),
  folder: z.string().optional(),
  tags: z.array(z.string()).default([]),
  context: contextFields.extend({ custom: contextFields.optional() }).nullish(),
});
const pageSchema = z.object({
  resources: z.array(resourceSchema),
  next_cursor: z.string().nullish(),
});

export interface Photo {
  id: string;
  width: number;
  height: number;
  format: string;
  createdAt: string;
  folder: string;
  tags: string[];
  caption: string;
}

/** Fetch every page and validate external data before any page can be published. */
export async function fetchPhotos(
  fetchPage: (cursor?: string) => Promise<unknown>,
): Promise<Photo[]> {
  const photos = new Map<string, Photo>();
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = pageSchema.parse(await fetchPage(cursor));
    for (const resource of page.resources) {
      const context = resource.context?.custom ?? resource.context;
      photos.set(resource.public_id, {
        id: resource.public_id,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        createdAt: resource.created_at,
        folder: resource.asset_folder ?? resource.folder ?? "",
        tags: resource.tags,
        caption: context?.caption || context?.alt || "",
      });
    }
    cursor = page.next_cursor || undefined;
    if (cursor && cursors.has(cursor))
      throw new Error("Cloudinary returned a repeated pagination cursor.");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return [...photos.values()].sort((a, b) => a.id.localeCompare(b.id, "en"));
}

/** Production builds share a snapshot; the development server refreshes each minute. */
export const getPhotos = createAsyncCache(loadPhotos, {
  maxAgeMs: import.meta.env?.DEV ? 60_000 : Infinity,
});

async function loadPhotos(): Promise<Photo[]> {
  if (__PHOTO_CATALOG_FIXTURE__) {
    const { default: fixture } = await import("../../tests/fixtures/photos.json");
    return fetchPhotos(async () => fixture);
  }
  const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Set PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET before building.",
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  try {
    const photos = await fetchPhotos(async (cursor) => {
      let search = cloudinary.search
        .expression("resource_type:image")
        .with_field("context")
        .with_field("tags")
        .sort_by("public_id", "asc")
        .max_results(500);
      if (cursor) search = search.next_cursor(cursor);
      return search.execute();
    });
    console.info(`Loaded ${photos.length} photographs from Cloudinary.`);
    return photos;
  } catch (error) {
    // Do not turn unavailable or malformed data into a successful, empty deployment.
    throw new Error("Could not load the Cloudinary photo catalog; build stopped.", {
      cause: error,
    });
  }
}

export function selectAlbumPhotos(photos: Photo[], albumId: string): Photo[] {
  return albumId === "portfolio"
    ? photos.filter((photo) => photo.tags.includes("portfolio"))
    : photos.filter((photo) => photo.folder === `albums/${albumId}`);
}

export async function getAlbumPhotos(albumId: string): Promise<Photo[]> {
  const photos = selectAlbumPhotos(await getPhotos(), albumId);
  if (photos.length === 0)
    throw new Error(`Album "${albumId}" has no photographs. Check its Cloudinary folder or tags.`);
  return photos;
}
