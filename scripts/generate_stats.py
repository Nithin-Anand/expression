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

def get_upload_timeline() -> list[dict]:
    """Get cumulative upload timeline data by fetching all images and sorting by created_at"""
    from datetime import datetime
    from collections import defaultdict
    
    # Fetch all images with their created_at timestamps
    all_images = []
    next_cursor = None
    
    while True:
        search = cloudinary.Search().expression("resource_type:image").max_results(500).sort_by("created_at", "asc")
        if next_cursor:
            search = search.next_cursor(next_cursor)
        
        result = search.execute()
        all_images.extend(result.get('resources', []))
        
        next_cursor = result.get('next_cursor')
        if not next_cursor:
            break
    
    logger.info(f"Fetched {len(all_images)} images for timeline")
    
    # Group by date and calculate cumulative count
    date_counts = defaultdict(int)
    for img in all_images:
        created_at = datetime.fromisoformat(img['created_at'].replace('Z', '+00:00'))
        date_key = created_at.strftime('%Y-%m-%d')
        date_counts[date_key] += 1
    
    # Sort dates and calculate cumulative
    sorted_dates = sorted(date_counts.keys())
    cumulative = 0
    timeline_data = []
    
    for date in sorted_dates:
        cumulative += date_counts[date]
        timeline_data.append({
            "date": date,
            "count": cumulative
        })
    
    return timeline_data

def get_recently_added() -> list[dict]:
    """Get the 3 most recently added images with their details"""
    result = cloudinary.Search().expression("resource_type:image").max_results(3).sort_by("created_at", "desc").execute()
    
    recent_images = []
    for img in result.get('resources', []):
        from datetime import datetime
        created_at = datetime.fromisoformat(img['created_at'].replace('Z', '+00:00'))
        
        recent_images.append({
            "public_id": img['public_id'],
            "url": img['secure_url'],
            "created_at": created_at.strftime('%Y-%m-%d'),
            "width": img.get('width', 0),
            "height": img.get('height', 0)
        })
    
    return recent_images

def create_output_json():
    json_dict = {}
    json_dict["total_count"] = get_image_counts()
    json_dict["portfolio_count"] = get_portfolio_count()
    json_dict["album_counts"] = get_album_counts()
    json_dict["upload_timeline"] = get_upload_timeline()
    json_dict["recently_added"] = get_recently_added()

    import json
    with open('public/stats.json', 'w') as f:
        json.dump(json_dict, f, indent=2)
    
    logger.info("Stats written to public/stats.json")

def main():
    create_output_json()


if __name__ == '__main__':
    main()
