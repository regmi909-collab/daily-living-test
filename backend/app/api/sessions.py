from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, MeditationSession, Content
from app.schemas.schemas import SessionCreate, SessionResponse
from app.services.streak_service import update_user_session_stats

router = APIRouter(prefix="/sessions", tags=["Meditation Sessions"])

@router.post("", response_model=SessionResponse)
def log_meditation_session(
    payload: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a completed meditation session (bell timer, audio guided, or video guided),
    and automatically recalculate the user's daily mindful streak and stats.
    """
    # Verify content_id if provided
    if payload.content_id:
        content = db.query(Content).filter(Content.id == payload.content_id).first()
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")

    session = MeditationSession(
        user_id=current_user.id,
        content_id=payload.content_id,
        mode=payload.mode,
        duration_seconds=payload.duration_seconds,
        ambient_sound=payload.ambient_sound or "none",
        completed=payload.completed,
        mood=payload.mood,
        notes=payload.notes,
        started_at=datetime.now(timezone.utc),
        ended_at=datetime.now(timezone.utc)
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Recalculate streak and total minutes
    update_user_session_stats(db, current_user, payload.duration_seconds)

    return session

@router.get("", response_model=List[SessionResponse])
def get_user_sessions(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    mode: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch recent meditation session logs for the authenticated user."""
    query = db.query(MeditationSession).filter(MeditationSession.user_id == current_user.id)
    if mode:
        query = query.filter(MeditationSession.mode == mode)
    
    sessions = query.order_by(MeditationSession.started_at.desc()).offset(offset).limit(limit).all()
    return sessions
