import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db

# Use in-memory SQLite with StaticPool so all connections share the same database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    from app.services.seed_data import seed_database_if_empty
    db = TestingSessionLocal()
    seed_database_if_empty(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_content_list_and_tags():
    # Test getting all content
    resp = client.get("/api/v1/content")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 5

    # Test filtering by type
    audio_resp = client.get("/api/v1/content?type=audio_meditation")
    assert audio_resp.status_code == 200
    assert all(i["type"] == "audio_meditation" for i in audio_resp.json())

    # Test tags endpoint
    tags_resp = client.get("/api/v1/tags")
    assert tags_resp.status_code == 200
    assert len(tags_resp.json()) >= 4

    # Test teachers endpoint
    teachers_resp = client.get("/api/v1/teachers")
    assert teachers_resp.status_code == 200
    assert len(teachers_resp.json()) >= 3

def test_auth_and_dashboard_flow():
    # Login via demo / Google flow
    auth_resp = client.post("/api/v1/auth/google", json={
        "id_token": "demo_test_token_123",
        "demo_email": "tester@mindful.guru",
        "demo_name": "Zen Tester",
        "demo_picture": "https://example.com/zen.jpg"
    })
    assert auth_resp.status_code == 200
    token_data = auth_resp.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /me endpoint
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "tester@mindful.guru"

    # Log a meditation session (Bell Timer mode, 10 min = 600s)
    session_resp = client.post("/api/v1/sessions", headers=headers, json={
        "mode": "bell_timer",
        "duration_seconds": 600,
        "ambient_sound": "singing_bowl",
        "completed": True,
        "mood": "peaceful",
        "notes": "Felt grounded and present."
    })
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    assert session_data["mode"] == "bell_timer"
    assert session_data["duration_seconds"] == 600

    # Verify Dashboard Stats
    stats_resp = client.get("/api/v1/dashboard/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["current_streak_days"] >= 1
    assert stats["total_minutes_meditated"] >= 10
    assert stats["total_sessions_count"] >= 1
    assert len(stats["weekly_activity"]) == 7
    assert any(b["achieved"] for b in stats["badges"])

def test_chat_message():
    # Login to chat
    auth_resp = client.post("/api/v1/auth/google", json={
        "id_token": "demo_chat_user",
        "demo_email": "chatter@mindful.guru",
        "demo_name": "Mindful Chatter"
    })
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    chat_resp = client.post("/api/v1/chat/message", headers=headers, json={
        "message": "I am feeling anxious about an exam and need help calming down."
    })
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    assert chat_data["role"] == "model"
    assert len(chat_data["message"]) > 30

    # Check history
    history_resp = client.get("/api/v1/chat/history", headers=headers)
    assert history_resp.status_code == 200
    assert len(history_resp.json()) >= 2

def test_youtube_metadata_extractor():
    from app.services.youtube_service import extract_video_id, fetch_youtube_video_metadata
    
    # Test video ID extraction
    vid_id = extract_video_id("https://www.youtube.com/watch?v=inpok4MKVLM")
    assert vid_id == "inpok4MKVLM"

    short_id = extract_video_id("https://youtu.be/inpok4MKVLM")
    assert short_id == "inpok4MKVLM"

    # Test metadata fetching
    meta = fetch_youtube_video_metadata("https://www.youtube.com/watch?v=inpok4MKVLM")
    assert meta is not None
    assert meta["video_id"] == "inpok4MKVLM"
    assert "embed_url" in meta

