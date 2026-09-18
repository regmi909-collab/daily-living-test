import re
import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

def extract_video_id(url_or_id: str) -> Optional[str]:
    """Extract 11-character YouTube video ID from various URL formats."""
    url_or_id = url_or_id.strip()
    if len(url_or_id) == 11 and re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
        return url_or_id

    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:shorts\/)([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    return None

def fetch_youtube_video_metadata(video_url_or_id: str) -> Optional[Dict]:
    """
    Fetches video metadata via YouTube oEmbed API (Zero API key required!).
    Returns title, author_name, thumbnail_url, embed_url.
    """
    video_id = extract_video_id(video_url_or_id)
    if not video_id:
        return None

    standard_url = f"https://www.youtube.com/watch?v={video_id}"
    oembed_url = f"https://www.youtube.com/oembed?url={standard_url}&format=json"

    try:
        response = requests.get(oembed_url, timeout=8)
        if response.status_code == 200:
            data = response.json()
            return {
                "video_id": video_id,
                "title": data.get("title", f"Meditation Video {video_id}"),
                "author_name": data.get("author_name", "Meditation Guide"),
                "thumbnail_url": data.get("thumbnail_url", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"),
                "embed_url": f"https://www.youtube.com/embed/{video_id}",
                "watch_url": standard_url,
                "duration_seconds": 600 # default estimate unless specified
            }
    except Exception as e:
        logger.warning(f"Failed to fetch YouTube oEmbed: {e}")

    # Fallback to direct thumbnail and embed if oembed blocked
    return {
        "video_id": video_id,
        "title": f"Meditation Practice ({video_id})",
        "author_name": "Meditation Guide",
        "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "embed_url": f"https://www.youtube.com/embed/{video_id}",
        "watch_url": standard_url,
        "duration_seconds": 600
    }

def fetch_youtube_channel_or_playlist_videos(feed_url_or_id: str) -> List[Dict]:
    """
    Fetches videos from a public YouTube Channel or Playlist RSS feed without needing an API key.
    Accepts:
      - Channel ID (e.g. UCxxxxxxxx)
      - Playlist ID (e.g. PLxxxxxxxx)
      - Full Channel or Playlist URL
    """
    feed_url = feed_url_or_id.strip()

    if "playlist?list=" in feed_url:
        playlist_id = feed_url.split("list=")[1].split("&")[0]
        feed_url = f"https://www.youtube.com/feeds/videos.xml?playlist_id={playlist_id}"
    elif feed_url.startswith("PL"):
        feed_url = f"https://www.youtube.com/feeds/videos.xml?playlist_id={feed_url}"
    elif "channel/" in feed_url:
        channel_id = feed_url.split("channel/")[1].split("/")[0].split("?")[0]
        feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    elif feed_url.startswith("UC"):
        feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={feed_url}"

    try:
        resp = requests.get(feed_url, timeout=10)
        if resp.status_code != 200:
            return []

        # Parse XML Atom Feed
        root = ET.fromstring(resp.content)
        ns = {
            "atom": "http://www.w3.org/2005/Atom",
            "yt": "http://www.youtube.com/xml/schemas/2015",
            "media": "http://search.yahoo.com/mrss/"
        }

        results = []
        for entry in root.findall("atom:entry", ns):
            video_id_el = entry.find("yt:videoId", ns)
            title_el = entry.find("atom:title", ns)
            desc_el = entry.find("media:group/media:description", ns)
            thumb_el = entry.find("media:group/media:thumbnail", ns)

            if video_id_el is not None and title_el is not None:
                vid_id = video_id_el.text
                results.append({
                    "video_id": vid_id,
                    "title": title_el.text or "Guided Meditation",
                    "description": desc_el.text if desc_el is not None else "",
                    "thumbnail_url": thumb_el.attrib.get("url") if thumb_el is not None else f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg",
                    "embed_url": f"https://www.youtube.com/embed/{vid_id}",
                    "watch_url": f"https://www.youtube.com/watch?v={vid_id}",
                    "duration_seconds": 600
                })
        return results
    except Exception as e:
        logger.error(f"Error fetching YouTube feed: {e}")
        return []
