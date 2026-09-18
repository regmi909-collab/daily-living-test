from datetime import date, timedelta, datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import User, UserStats, MeditationSession
from app.schemas.schemas import WeeklyDayStat, MilestoneBadge

def update_user_session_stats(db: Session, user: User, session_duration_seconds: int) -> UserStats:
    stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
    if not stats:
        stats = UserStats(
            user_id=user.id,
            current_streak_days=0,
            longest_streak_days=0,
            total_minutes_meditated=0,
            total_sessions_count=0,
            last_session_date=None
        )
        db.add(stats)
        db.flush()

    today = date.today()
    last_date = stats.last_session_date

    # Update streaks
    if last_date is None:
        stats.current_streak_days = 1
    elif last_date == today:
        # Already meditated today, streak count stays the same
        pass
    elif last_date == today - timedelta(days=1):
        # Meditated yesterday, increment streak
        stats.current_streak_days += 1
    else:
        # Missed at least one day, reset streak to 1
        stats.current_streak_days = 1

    if stats.current_streak_days > stats.longest_streak_days:
        stats.longest_streak_days = stats.current_streak_days

    stats.last_session_date = today
    stats.total_sessions_count += 1
    stats.total_minutes_meditated += max(1, round(session_duration_seconds / 60))

    db.commit()
    db.refresh(stats)
    return stats

def get_weekly_stats(db: Session, user_id: str) -> list[WeeklyDayStat]:
    today = date.today()
    days_data = []

    # Get the last 7 days (including today)
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_name = target_date.strftime("%a")
        
        # Query sessions completed on target_date
        start_of_day = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
        end_of_day = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

        sessions = db.query(MeditationSession).filter(
            MeditationSession.user_id == user_id,
            MeditationSession.started_at >= start_of_day,
            MeditationSession.started_at <= end_of_day,
            MeditationSession.completed == True
        ).all()

        total_sec = sum(s.duration_seconds for s in sessions)
        minutes = round(total_sec / 60)

        days_data.append(WeeklyDayStat(
            day=day_name,
            date=target_date.isoformat(),
            minutes=minutes,
            sessions_count=len(sessions)
        ))

    return days_data

def calculate_badges(stats: UserStats) -> list[MilestoneBadge]:
    total_min = stats.total_minutes_meditated if stats else 0
    total_sess = stats.total_sessions_count if stats else 0
    streak = stats.current_streak_days if stats else 0

    return [
        MilestoneBadge(
            id="first_step",
            title="First Step",
            description="Completed your very first meditation session",
            icon="🌱",
            achieved=total_sess >= 1
        ),
        MilestoneBadge(
            id="streak_3",
            title="3-Day Rhythm",
            description="Maintained a mindful streak for 3 consecutive days",
            icon="🔥",
            achieved=streak >= 3
        ),
        MilestoneBadge(
            id="streak_7",
            title="7-Day Zen Master",
            description="Achieved a continuous full week of daily meditation",
            icon="🧘",
            achieved=streak >= 7 or (stats and stats.longest_streak_days >= 7)
        ),
        MilestoneBadge(
            id="minutes_60",
            title="Golden Hour",
            description="Accumulated 60 total minutes in presence and stillness",
            icon="⏳",
            achieved=total_min >= 60
        ),
        MilestoneBadge(
            id="minutes_300",
            title="Deep Stillness",
            description="Reached 300 minutes of mindfulness practice",
            icon="🌊",
            achieved=total_min >= 300
        ),
        MilestoneBadge(
            id="century_club",
            title="Mindful Master",
            description="Completed 25 guided or unassisted sessions",
            icon="✨",
            achieved=total_sess >= 25
        )
    ]
