import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with secure URLs
const cloudinaryConfig = {
    secure: true,
    cloud_name: import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: import.meta.env.PUBLIC_CLOUDINARY_API_KEY,
    api_secret: import.meta.env.CLOUDINARY_API_SECRET
};

cloudinary.config(cloudinaryConfig);

export interface CloudinaryImage {
    public_id: string;
    url: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

export async function getImagesByFolder(folderName: string): Promise<CloudinaryImage[]> {
    try {
        const result = await new Promise((resolve, reject) => {
            cloudinary.api.resources_by_asset_folder(
                folderName,
                {
                    tags: true,
                    metadata: true,
                    max_results: 500 // Adjust this number based on your needs
                },
                (error: any, result: any) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
        });

        // Type assertion since we know the structure
        const typedResult = result as { resources: any[] };
        
        return typedResult.resources.map(resource => ({
            public_id: resource.public_id,
            url: resource.url,
            secure_url: resource.secure_url,
            width: resource.width,
            height: resource.height,
            format: resource.format,
            tags: resource.tags,
            metadata: resource.metadata
        }));
    } catch (error) {
        console.error('Error fetching images from Cloudinary:', error);
        throw error;
    }
}