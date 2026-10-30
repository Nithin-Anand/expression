import assert from "node:assert/strict";
import { test } from "node:test";
import type { Photo } from "../src/data/photos.ts";
import { buildStats } from "../src/lib/stats.ts";
import { formatDate } from "../src/lib/dates.ts";

const photo = (id: string, createdAt: string, folder = "albums/france_2026"): Photo => ({
  id,
  createdAt,
  folder,
  width: 1200,
  height: 800,
  format: "jpg",
  tags: ["portfolio"],
  caption: "",
});

test("timeline has one entry per UTC day across daylight-saving transitions in every build timezone", () => {
  const original = process.env.TZ;
  try {
    for (const timezone of ["UTC", "Europe/London", "America/Los_Angeles"]) {
      process.env.TZ = timezone;
      const stats = buildStats(
        [photo("a", "2026-03-28T00:00:00Z"), photo("b", "2026-03-31T00:00:00Z")],
        {},
      );
      assert.deepEqual(
        stats.upload_timeline,
        [
          { date: "2026-03-28", count: 1 },
          { date: "2026-03-29", count: 1 },
          { date: "2026-03-30", count: 1 },
          { date: "2026-03-31", count: 2 },
        ],
        timezone,
      );
      assert.equal(formatDate("2026-09-01", true), "September 2026");
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("stats count known albums, retain zero counts, and only link recent photos to published albums", () => {
  const stats = buildStats(
    [
      photo("a", "2026-03-28T00:00:00Z"),
      photo("b", "2026-03-30T00:00:00Z", "albums/misc"),
      photo("c", "2026-03-29T00:00:00Z", "albums/not-published"),
    ],
    { france_2026: "France", empty: "Empty", portfolio: "Portfolio" },
  );
  assert.equal(stats.total_count, 3);
  assert.equal(stats.portfolio_count, 3);
  assert.deepEqual(stats.album_counts, { "albums/france_2026": 1, "albums/empty": 0 });
  assert.deepEqual(
    stats.recently_added.map((photo) => photo.album_id),
    [null, null, "france_2026"],
  );
  assert.equal(stats.recently_added[2]?.album_name, "France");
  assert.deepEqual(buildStats([], {}).upload_timeline, []);
});
