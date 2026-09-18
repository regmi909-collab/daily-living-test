from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date

# ----------------- Auth & User Schemas -----------------
class GoogleAuthRequest(BaseModel):
    id_token: str
    demo_email: Optional[str] = None
    demo_name: Optional[str] = None
    demo_picture: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    is_admin: bool = False
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ----------------- Teacher & Tag Schemas -----------------
class TagBase(BaseModel):
    name: str
    slug: str
    color_hex: Optional[str] = "#4A7C59"

class TagResponse(TagBase):
    model_config = ConfigDict(from_attributes=True)
    id: str

class TeacherBase(BaseModel):
    name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class TeacherCreate(TeacherBase):
    pass

class TeacherResponse(TeacherBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime

# ----------------- Content Schemas (Meditations & Blogs) -----------------
class ContentBase(BaseModel):
    type: str  # audio_meditation, video_meditation, blog_post
    title: str
    slug: str
    summary: Optional[str] = None
    body_markdown: Optional[str] = None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: int = 0
    teacher_id: Optional[str] = None
    is_published: bool = True

class ContentCreate(ContentBase):
    tag_ids: Optional[List[str]] = []

class ContentUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    summary: Optional[str] = None
    body_markdown: Optional[str] = None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    teacher_id: Optional[str] = None
    is_published: Optional[bool] = None
    tag_ids: Optional[List[str]] = None

class ContentResponse(ContentBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
    teacher: Optional[TeacherResponse] = None
    tags: List[TagResponse] = []

# ----------------- Meditation Session Schemas -----------------
class SessionCreate(BaseModel):
    content_id: Optional[str] = None
    mode: str = Field(..., description="bell_timer, audio_guided, video_guided")
    duration_seconds: int = Field(..., ge=1, description="Duration meditated in seconds")
    ambient_sound: Optional[str] = "none"
    completed: bool = True
    mood: Optional[str] = None
    notes: Optional[str] = None

class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    content_id: Optional[str] = None
    mode: str
    duration_seconds: int
    ambient_sound: str
    completed: bool
    mood: Optional[str] = None
    notes: Optional[str] = None
    started_at: datetime
    ended_at: datetime
    content: Optional[ContentResponse] = None

# ----------------- Dashboard & Stats Schemas -----------------
class WeeklyDayStat(BaseModel):
    day: str  # Mon, Tue, etc.
    date: str # YYYY-MM-DD
    minutes: int
    sessions_count: int

class MilestoneBadge(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    achieved: bool
    unlocked_at: Optional[str] = None

class DashboardStatsResponse(BaseModel):
    current_streak_days: int
    longest_streak_days: int
    total_minutes_meditated: int
    total_sessions_count: int
    last_session_date: Optional[date] = None
    weekly_activity: List[WeeklyDayStat]
    badges: List[MilestoneBadge]
    recent_sessions: List[SessionResponse]

# ----------------- Chatbot Schemas -----------------
class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: str
    message: str
    recommended_content_id: Optional[str] = None
    recommended_content: Optional[ContentResponse] = None
    created_at: datetime

# ----------------- Admin / Upload Schemas -----------------
class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
    file_type: str = Field("media", description="media, audio, video, image")

class UploadUrlResponse(BaseModel):
    upload_url: str
    public_url: str
    file_key: str

class YouTubeSingleSyncRequest(BaseModel):
    video_url: str
    teacher_id: Optional[str] = None
    tag_ids: Optional[List[str]] = []
    custom_title: Optional[str] = None
    custom_summary: Optional[str] = None
    duration_minutes: Optional[int] = 10

class YouTubeFeedSyncRequest(BaseModel):
    channel_or_playlist: str
    teacher_id: Optional[str] = None
    tag_ids: Optional[List[str]] = []

class SyncResponse(BaseModel):
    success: bool
    message: str
    synced_count: int
    items: List[ContentResponse] = []
