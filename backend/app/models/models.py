import uuid
from datetime import datetime, timezone, date
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, Date, ForeignKey, Table
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

# Association table for Content <-> Tag (many-to-many)
content_tags = Table(
    "content_tags",
    Base.metadata,
    Column("content_id", String(36), ForeignKey("content.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    photo_url = Column(Text, nullable=True)
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    stats = relationship("UserStats", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("MeditationSession", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")

class UserStats(Base):
    __tablename__ = "user_stats"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    current_streak_days = Column(Integer, default=0)
    longest_streak_days = Column(Integer, default=0)
    total_minutes_meditated = Column(Integer, default=0)
    total_sessions_count = Column(Integer, default=0)
    last_session_date = Column(Date, nullable=True)

    user = relationship("User", back_populates="stats")

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    contents = relationship("Content", back_populates="teacher")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    color_hex = Column(String(16), default="#4A7C59")

    contents = relationship("Content", secondary=content_tags, back_populates="tags")

class Content(Base):
    __tablename__ = "content"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    type = Column(String(30), nullable=False)  # audio_meditation, video_meditation, blog_post
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    summary = Column(Text, nullable=True)
    body_markdown = Column(Text, nullable=True)       # For reflections, transcripts, blog posts
    media_url = Column(Text, nullable=True)           # Audio MP3 or Video HLS / YouTube embed
    thumbnail_url = Column(Text, nullable=True)
    duration_seconds = Column(Integer, default=0)     # e.g. 600 for 10 min audio
    teacher_id = Column(String(36), ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    teacher = relationship("Teacher", back_populates="contents")
    tags = relationship("Tag", secondary=content_tags, back_populates="contents")
    sessions = relationship("MeditationSession", back_populates="content")

class MeditationSession(Base):
    __tablename__ = "meditation_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content_id = Column(String(36), ForeignKey("content.id", ondelete="SET NULL"), nullable=True)
    mode = Column(String(30), nullable=False)  # bell_timer, audio_guided, video_guided
    duration_seconds = Column(Integer, nullable=False)
    ambient_sound = Column(String(50), default="none")  # singing_bowl, rain, forest, stream, drone
    completed = Column(Boolean, default=True)
    mood = Column(String(50), nullable=True)  # peaceful, grounded, calm, grateful, clear
    notes = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sessions")
    content = relationship("Content", back_populates="sessions")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user, model
    message = Column(Text, nullable=False)
    recommended_content_id = Column(String(36), ForeignKey("content.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="chat_messages")
    recommended_content = relationship("Content")
