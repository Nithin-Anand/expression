import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchPhotos, selectAlbumPhotos } from "../src/data/photos.ts";

const resource = (id: string, extra: Record<string, unknown> = {}) => ({
  public_id: id,
  resource_type: "image",
  width: 1200,
  height: 800,
  format: "jpg",
  created_at: "2026-03-29T00:00:00Z",
  asset_folder: "albums/france_2026",
  ...extra,
});

test("photo catalog follows cursors, deduplicates overlapping pages, and keeps stable ID order", async () => {
  const calls: (string | undefined)[] = [];
  const photos = await fetchPhotos(async (cursor) => {
    calls.push(cursor);
    return cursor
      ? { resources: [resource("b"), resource("a")], next_cursor: null }
      : { resources: [resource("c"), resource("b")], next_cursor: "page2" };
  });
  assert.deepEqual(calls, [undefined, "page2"]);
  assert.deepEqual(
    photos.map((photo) => photo.id),
    ["a", "b", "c"],
  );
});

test("Cloudinary failures and invalid resources stop publication instead of becoming empty galleries", async () => {
  await assert.rejects(
    fetchPhotos(async () => {
      throw new Error("Cloudinary unavailable");
    }),
    /unavailable/,
  );
  await assert.rejects(fetchPhotos(async () => ({ resources: [resource("bad", { width: 0 })] })));
  await assert.rejects(
    fetchPhotos(async () => ({ resources: [resource("video", { resource_type: "video" })] })),
  );
});

test("a repeated pagination cursor fails rather than looping forever", async () => {
  await assert.rejects(
    fetchPhotos(async () => ({ resources: [], next_cursor: "same" })),
    /repeated/,
  );
});

test("captions and folders normalize across Cloudinary response formats", async () => {
  const photos = await fetchPhotos(async () => ({
    resources: [
      resource("a", {
        context: { custom: { caption: "A caption", alt: "An alt" } },
        tags: ["portfolio"],
      }),
      resource("b", {
        context: { alt: "Flat alt" },
        asset_folder: undefined,
        folder: "albums/legacy",
      }),
      resource("c", { context: null }),
    ],
  }));
  assert.deepEqual(
    photos.map((photo) => photo.caption),
    ["A caption", "Flat alt", ""],
  );
  assert.deepEqual(
    selectAlbumPhotos(photos, "portfolio").map((photo) => photo.id),
    ["a"],
  );
  assert.deepEqual(
    selectAlbumPhotos(photos, "legacy").map((photo) => photo.id),
    ["b"],
  );
  assert.equal(selectAlbumPhotos(photos, "france_2026").length, 2);
});
