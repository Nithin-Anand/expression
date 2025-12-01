#!/usr/bin/env python3
"""
Generate image statistics from Cloudinary for the easter egg.
Runs at build time to create a static JSON file.
"""

import os
import cloudinary
import cloudinary.api
from loguru import logger


# Configure Cloudinary
config = cloudinary.config(
    cloud_name=os.getenv('PUBLIC_CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

def get_image_counts() -> int:
    result = cloudinary.Search().expression("resource_type:image").max_results(0).execute()
    return result['total_count']

def get_album_counts() -> dict[str, int]:
    # Aggregations are not supported on the free plan, so we fetch folders and count manually
    folders_response = cloudinary.api.subfolders("albums")
    counts = {}
    for folder in folders_response['folders']:
        folder_path = folder['path']
        if 'misc' == folder_path.split("/")[-1].lower():
            continue
        # Search for images in this specific folder
        result = cloudinary.Search().expression(f"folder:{folder_path} AND resource_type:image").max_results(0).execute()
        counts[folder_path] = result['total_count']
    return counts

def get_portfolio_count() -> int:
    result = cloudinary.Search().expression("tags:portfolio AND resource_type:image").max_results(0).execute()
    return result['total_count']

def create_output_json():
    json_dict = {}
    json_dict["total_count"] = get_image_counts()
    json_dict["portfolio_count"] = get_portfolio_count()
    json_dict["album_counts"] = get_album_counts()

    import json
    with open('public/stats.json', 'w') as f:
        json.dump(json_dict, f, indent=2)
    
    logger.info("Stats written to public/stats.json")

def main():
    create_output_json()


if __name__ == '__main__':
    main()
