from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.models.models import User, UserStats
from app.schemas.schemas import GoogleAuthRequest, TokenResponse, UserResponse
from google.oauth2 import id_token
from google.auth.transport import requests
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Direct Google OAuth 2.0 verification:
    Verifies the client's Google id_token directly with Google's public keys.
    Also provides a seamless demo mode for local development.
    """
    email = None
    name = None
    picture = None
    google_sub = None

    # 1. If real id_token provided and GOOGLE_CLIENT_ID configured
    if payload.id_token and not payload.id_token.startswith("demo_"):
        try:
            idinfo = id_token.verify_oauth2_token(
                payload.id_token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
            )
            email = idinfo.get("email")
            name = idinfo.get("name")
            picture = idinfo.get("picture")
            google_sub = idinfo.get("sub")
        except Exception as e:
            logger.warning(f"Google token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google token verification failed: {str(e)}"
            )
    else:
        # Development / Demo bypass mode
        email = payload.demo_email or "mindful.seeker@meditationguru.app"
        name = payload.demo_name or "Mindful Seeker"
        picture = payload.demo_picture or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        google_sub = f"demo_sub_{email}"

    if not email:
        raise HTTPException(status_code=400, detail="Could not determine user email")

    # 2. Find or create user in DB
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Check if first user, make them admin
        is_first = db.query(User).count() == 0
        user = User(
            email=email,
            display_name=name,
            photo_url=picture,
            google_id=google_sub,
            is_admin=is_first or "admin" in email.lower()
        )
        db.add(user)
        db.flush()

        # Initialize UserStats
        stats = UserStats(
            user_id=user.id,
            current_streak_days=0,
            longest_streak_days=0,
            total_minutes_meditated=0,
            total_sessions_count=0
        )
        db.add(stats)
        db.commit()
        db.refresh(user)
    else:
        # Update user profile info if changed
        user.display_name = name or user.display_name
        user.photo_url = picture or user.photo_url
        if google_sub and not user.google_id:
            user.google_id = google_sub
        db.commit()
        db.refresh(user)

    # 3. Generate internal JWT access token
    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the current authenticated user."""
    return UserResponse.model_validate(current_user)
