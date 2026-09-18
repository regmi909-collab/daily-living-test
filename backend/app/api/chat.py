from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, ChatMessage, Content
from app.schemas.schemas import ChatMessageCreate, ChatMessageResponse
from app.services.gemini_service import generate_guru_response

router = APIRouter(prefix="/chat", tags=["Mindful Guru Chatbot"])

@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to Bodhi (the Mindful Guru AI companion).
    Processes emotional context, offers compassionate mindfulness grounding,
    and recommends relevant practices from your meditation catalog.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # 1. Log the user's message
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        message=payload.message.strip()
    )
    db.add(user_msg)
    db.commit()

    # 2. Fetch recent conversation history
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc()).limit(8).all()
    history_dicts = [{"role": m.role, "message": m.message} for m in reversed(history)]

    # 3. Fetch available practices to ground AI recommendations
    practices = db.query(Content).filter(
        Content.is_published == True,
        Content.type.in_(["audio_meditation", "video_meditation"])
    ).limit(10).all()
    practice_dicts = [
        {"id": p.id, "title": p.title, "type": p.type, "summary": p.summary}
        for p in practices
    ]

    # 4. Generate Guru AI Response
    reply_text, recommended_id = generate_guru_response(
        user_message=payload.message,
        recent_history=history_dicts,
        available_practices=practice_dicts
    )

    # 5. Save Guru AI response
    bot_msg = ChatMessage(
        user_id=current_user.id,
        role="model",
        message=reply_text,
        recommended_content_id=recommended_id
    )
    db.add(bot_msg)
    db.commit()
    db.refresh(bot_msg)

    return bot_msg

@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch previous conversation history with the Mindful Guru."""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).limit(limit).all()
    return messages
