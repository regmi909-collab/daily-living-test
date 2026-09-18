from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, UserStats, MeditationSession
from app.schemas.schemas import DashboardStatsResponse, SessionResponse
from app.services.streak_service import get_weekly_stats, calculate_badges

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated dashboard metrics for the user:
    - Mindful streak (current and longest)
    - Total minutes meditated
    - Total sessions completed
    - Weekly 7-day breakdown (minutes per day)
    - Milestone achievement badges
    - 5 most recent sessions
    """
    stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if not stats:
        stats = UserStats(
            user_id=current_user.id,
            current_streak_days=0,
            longest_streak_days=0,
            total_minutes_meditated=0,
            total_sessions_count=0
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)

    weekly_activity = get_weekly_stats(db, current_user.id)
    badges = calculate_badges(stats)

    recent_sessions = db.query(MeditationSession).filter(
        MeditationSession.user_id == current_user.id
    ).order_by(MeditationSession.started_at.desc()).limit(5).all()

    return DashboardStatsResponse(
        current_streak_days=stats.current_streak_days,
        longest_streak_days=stats.longest_streak_days,
        total_minutes_meditated=stats.total_minutes_meditated,
        total_sessions_count=stats.total_sessions_count,
        last_session_date=stats.last_session_date,
        weekly_activity=weekly_activity,
        badges=badges,
        recent_sessions=[SessionResponse.model_validate(s) for s in recent_sessions]
    )
