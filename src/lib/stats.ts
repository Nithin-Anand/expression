import type { Photo } from "../data/photos.ts";

export interface PhotoStats {
  total_count: number;
  portfolio_count: number;
  album_counts: Record<string, number>;
  upload_timeline: { date: string; count: number }[];
  recently_added: {
    public_id: string;
    width: number;
    height: number;
    caption: string;
    created_at: string;
    album_id: string | null;
    album_name: string | null;
  }[];
}

export function buildStats(photos: Photo[], albumTitles: Record<string, string>): PhotoStats {
  const albumCounts: Record<string, number> = {};
  for (const id of Object.keys(albumTitles)) {
    if (id !== "portfolio" && id !== "misc") albumCounts[`albums/${id}`] = 0;
  }
  const dates = new Map<string, number>();
  for (const photo of photos) {
    if (Object.hasOwn(albumCounts, photo.folder)) albumCounts[photo.folder]! += 1;
    const day = new Date(photo.createdAt).toISOString().slice(0, 10);
    dates.set(day, (dates.get(day) ?? 0) + 1);
  }
  const days = [...dates.keys()].sort();
  const timeline: PhotoStats["upload_timeline"] = [];
  if (days.length > 0) {
    const end = new Date(days.at(-1)!);
    const current = new Date(days[0]!);
    let count = 0;
    while (current <= end) {
      const day = current.toISOString().slice(0, 10);
      count += dates.get(day) ?? 0;
      timeline.push({ date: day, count });
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }
  return {
    total_count: photos.length,
    portfolio_count: photos.filter((photo) => photo.tags.includes("portfolio")).length,
    album_counts: albumCounts,
    upload_timeline: timeline,
    recently_added: [...photos]
      .sort(
        (a, b) =>
          Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id, "en"),
      )
      .slice(0, 3)
      .map((photo) => {
        const id = photo.folder.startsWith("albums/") ? photo.folder.slice(7) : "";
        const albumId = Object.hasOwn(albumTitles, id) ? id : null;
        return {
          public_id: photo.id,
          width: photo.width,
          height: photo.height,
          caption: photo.caption,
          created_at: new Date(photo.createdAt).toISOString().slice(0, 10),
          album_id: albumId,
          album_name: albumId ? albumTitles[albumId]! : null,
        };
      }),
  };
}
