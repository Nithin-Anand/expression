import type { APIRoute } from "astro";
import { getStats } from "../data/stats";
import { getCloudinaryImageUrl } from "../lib/cloudinary";

export const GET: APIRoute = async () => {
  const stats = await getStats();
  return Response.json({
    ...stats,
    recently_added: stats.recently_added.map((photo) => ({
      ...photo,
      url: getCloudinaryImageUrl({ src: photo.public_id, width: 480, height: 480, crop: "fill" }),
    })),
  });
};
