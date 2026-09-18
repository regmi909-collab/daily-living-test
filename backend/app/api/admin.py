import os
import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.models import User, Content, Tag, Teacher
from app.schemas.schemas import (
    ContentCreate, ContentUpdate, ContentResponse,
    UploadUrlRequest, UploadUrlResponse,
    YouTubeSingleSyncRequest, YouTubeFeedSyncRequest, SyncResponse
)

router = APIRouter(prefix="/admin", tags=["Creator Studio (Admin)"])

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to publish content."
        )
    return current_user

@router.post("/content", response_model=ContentResponse)
def create_content(
    payload: ContentCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Publish a new guided audio meditation, video meditation, or blog post."""
    existing = db.query(Content).filter(Content.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="A post or meditation with this slug already exists")

    content = Content(
        type=payload.type,
        title=payload.title,
        slug=payload.slug,
        summary=payload.summary,
        body_markdown=payload.body_markdown,
        media_url=payload.media_url,
        thumbnail_url=payload.thumbnail_url,
        duration_seconds=payload.duration_seconds,
        teacher_id=payload.teacher_id,
        is_published=payload.is_published
    )

    if payload.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        content.tags.extend(tags)

    db.add(content)
    db.commit()
    db.refresh(content)
    return content

@router.put("/content/{content_id}", response_model=ContentResponse)
def update_content(
    content_id: str,
    payload: ContentUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update an existing meditation practice or blog post."""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    update_data = payload.dict(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)

    for field, val in update_data.items():
        setattr(content, field, val)

    if tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        content.tags = tags

    db.commit()
    db.refresh(content)
    return content

@router.delete("/content/{content_id}")
def delete_content(
    content_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a meditation practice or blog post."""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    db.delete(content)
    db.commit()
    return {"message": "Content deleted successfully"}

@router.post("/upload-url", response_model=UploadUrlResponse)
def generate_upload_url(
    payload: UploadUrlRequest,
    current_user: User = Depends(require_admin)
):
    """
    Generate an S3 presigned upload URL or local upload route for creator videos,
    audios, or blog cover images.
    """
    unique_filename = f"{uuid.uuid4().hex}_{payload.filename}"
    
    # If AWS S3 credentials are set
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        try:
            import boto3
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            presigned_url = s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": unique_filename,
                    "ContentType": payload.content_type
                },
                ExpiresIn=3600
            )
            
            cdn_host = settings.CLOUDFRONT_DOMAIN or f"{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com"
            public_url = f"https://{cdn_host}/{unique_filename}"
            
            return UploadUrlResponse(
                upload_url=presigned_url,
                public_url=public_url,
                file_key=unique_filename
            )
        except Exception as e:
            pass

    # Fallback / Local mock URL for dev
    local_url = f"/uploads/{unique_filename}"
    return UploadUrlResponse(
        upload_url=f"/api/v1/admin/upload-direct?filename={unique_filename}",
        public_url=local_url,
        file_key=unique_filename
    )

@router.post("/sync-youtube-single", response_model=ContentResponse)
def sync_youtube_single(
    payload: YouTubeSingleSyncRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Auto-fetches video metadata (title, thumbnail, embed player) from a YouTube URL
    and creates a new Guided Video Meditation in your library.
    """
    from app.services.youtube_service import fetch_youtube_video_metadata

    meta = fetch_youtube_video_metadata(payload.video_url)
    if not meta:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL or video not found")

    title = payload.custom_title or meta["title"]
    base_slug = re.sub(r'[^\w\s-]', '', title.lower()).strip()
    base_slug = re.sub(r'[\s_-]+', '-', base_slug)
    slug = f"{base_slug}-{meta['video_id']}"

    existing = db.query(Content).filter(Content.slug == slug).first()
    if existing:
        return existing

    content = Content(
        type="video_meditation",
        title=title,
        slug=slug,
        summary=payload.custom_summary or f"Guided video meditation: {title}",
        body_markdown=f"Watch and meditate with this guided practice.\n\n[Open on YouTube]({meta['watch_url']})",
        media_url=meta["embed_url"],
        thumbnail_url=meta["thumbnail_url"],
        duration_seconds=(payload.duration_minutes or 10) * 60,
        teacher_id=payload.teacher_id,
        is_published=True
    )

    if payload.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        content.tags.extend(tags)

    db.add(content)
    db.commit()
    db.refresh(content)
    return content

@router.post("/sync-youtube-feed", response_model=SyncResponse)
def sync_youtube_feed(
    payload: YouTubeFeedSyncRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Batch import videos from a public YouTube Channel or Playlist into your meditation library.
    Zero API key required.
    """
    from app.services.youtube_service import fetch_youtube_channel_or_playlist_videos

    videos = fetch_youtube_channel_or_playlist_videos(payload.channel_or_playlist)
    if not videos:
        raise HTTPException(status_code=400, detail="No videos found or invalid channel/playlist URL")

    tags = []
    if payload.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()

    created_items = []
    for vid in videos:
        slug = f"yt-{vid['video_id']}"
        existing = db.query(Content).filter(Content.slug == slug).first()
        if existing:
            continue

        item = Content(
            type="video_meditation",
            title=vid["title"],
            slug=slug,
            summary=vid["description"][:200] if vid["description"] else "Guided video session",
            body_markdown=vid["description"] or "Guided video meditation practice.",
            media_url=vid["embed_url"],
            thumbnail_url=vid["thumbnail_url"],
            duration_seconds=600,
            teacher_id=payload.teacher_id,
            is_published=True
        )
        if tags:
            item.tags.extend(tags)

        db.add(item)
        created_items.append(item)

    db.commit()
    return SyncResponse(
        success=True,
        message=f"Successfully synced {len(created_items)} new meditation videos from YouTube!",
        synced_count=len(created_items),
        items=[ContentResponse.model_validate(c) for c in created_items]
    )

@router.post("/clear-all-content")
def clear_all_content(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Wipes all sample/demo content so the creator can start completely fresh."""
    db.query(Content).delete()
    db.commit()
    return {"message": "All content items have been cleared. Library is now clean."}

