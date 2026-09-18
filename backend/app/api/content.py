from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Content, Tag, Teacher
from app.schemas.schemas import ContentResponse, TagResponse, TeacherResponse

router = APIRouter(tags=["Content & Practices"])

@router.get("/content", response_model=List[ContentResponse])
def get_content_list(
    type: Optional[str] = Query(None, description="audio_meditation, video_meditation, blog_post"),
    tag: Optional[str] = Query(None, description="Tag slug (e.g. anxiety-stress, sleep-wisdom)"),
    search: Optional[str] = Query(None, description="Search keyword in title or summary"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Explore guided meditations, videos, and mindfulness blog articles.
    Supports filtering by type, topic tag, and keyword search.
    """
    query = db.query(Content).filter(Content.is_published == True)

    if type:
        query = query.filter(Content.type == type)

    if tag:
        query = query.filter(Content.tags.any(Tag.slug == tag))

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(or_(
            Content.title.ilike(search_fmt),
            Content.summary.ilike(search_fmt),
            Content.body_markdown.ilike(search_fmt)
        ))

    content_items = query.order_by(Content.created_at.desc()).offset(offset).limit(limit).all()
    return content_items

@router.get("/content/{slug_or_id}", response_model=ContentResponse)
def get_content_detail(
    slug_or_id: str,
    db: Session = Depends(get_db)
):
    """Fetch details of a single meditation or blog post by slug or UUID."""
    content = db.query(Content).filter(
        or_(Content.id == slug_or_id, Content.slug == slug_or_id)
    ).first()

    if not content:
        raise HTTPException(status_code=404, detail="Practice or article not found")
    return content

@router.get("/tags", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    """Fetch all topic tags (e.g. Anxiety, Sleep, Breath, RAIN)."""
    return db.query(Tag).order_by(Tag.name.asc()).all()

@router.get("/teachers", response_model=List[TeacherResponse])
def get_teachers(db: Session = Depends(get_db)):
    """Fetch all meditation teachers & guides."""
    return db.query(Teacher).order_by(Teacher.name.asc()).all()
