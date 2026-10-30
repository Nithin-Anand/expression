import { v2 as cloudinary } from "cloudinary";

interface ImageOptions {
  src: string;
  width: number;
  height?: number;
  crop?: "limit" | "fill";
  gravity?: "center" | "auto";
  format?: "auto" | "avif" | "webp";
  quality?: "auto";
}

export function getCloudinaryImageUrl({
  src,
  width,
  height,
  crop = "limit",
  gravity,
  format = "auto",
  quality = "auto",
}: ImageOptions): string {
  const cloudName =
    import.meta.env?.PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("PUBLIC_CLOUDINARY_CLOUD_NAME is required to build image URLs.");

  return cloudinary.url(src, {
    cloud_name: cloudName,
    secure: true,
    width,
    height,
    crop,
    gravity,
    fetch_format: format,
    quality,
  });
}
