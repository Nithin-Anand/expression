import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

export async function getAlbumImages(albumId: string) {
  try {
    const result = await cloudinary.search
      .expression(`folder:albums/${albumId}`)
      .sort_by('public_id', 'desc')
      .max_results(500)
      .execute();

    const images = result.resources.map((resource: any) => ({
      src: resource.secure_url,
      public_id: resource.public_id,
      width: resource.width,
      height: resource.height,
      format: resource.format,
    }));

    // Shuffle
    images.sort(() => Math.random() - 0.5);

    return images;
  } catch (error) {
    console.error(`Error fetching images for album ${albumId}:`, error);
    return [];
  }
}



// Add this function to load portfolio images from portfolio.yaml
export async function getPortfolioImages() {
  try {
    const result = await cloudinary.search
      .expression('tags:portfolio') // Search for images with 'portfolio' tag
      .with_field('context') // Fetch context (captions)
      .sort_by('public_id', 'desc')
      .max_results(500)
      .execute();

    const images = result.resources.map((resource: any) => ({
      src: resource.public_id,
      caption: resource.context?.custom?.caption || resource.context?.custom?.alt || '',
      width: resource.width,
      height: resource.height,
      format: resource.format,
    }));

    // Shuffle
    images.sort(() => Math.random() - 0.5);

    return images;
  } catch (error) {
    console.error("Error fetching portfolio images from Cloudinary:", error);
    return [];
  }
}

