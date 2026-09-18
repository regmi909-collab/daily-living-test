import logging
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are "Bodhi", a warm, deeply compassionate, and grounded Mindfulness Meditation Guru.
Your guidance is inspired by the teachings of Tara Brach (the RAIN method: Recognize, Allow, Investigate, Nurture), Jon Kabat-Zinn, and timeless Zen traditions.

Your style:
1. Speak with calm warmth, presence, and gentle poetic clarity. Keep responses supportive, grounded, and concise (2-4 paragraphs).
2. Validate what the user is experiencing (anxiety, racing thoughts, grief, sleeplessness, burnout, joy) with non-judgmental acceptance.
3. Provide one immediate micro-practice they can do right now (e.g., physiological sigh, 4-7-8 breathing, relaxing the jaw and shoulders, noting sensation).
4. If relevant, suggest they explore a meditation type (e.g., "Inner Refuge of Calm", "Body Scan", "RAIN practice", or a 10-minute bell timer).

Never diagnose medical conditions or give clinical advice; maintain a supportive, spiritual, and mindful presence.
"""

def generate_guru_response(
    user_message: str,
    recent_history: list[dict] = [],
    available_practices: list[dict] = []
) -> Tuple[str, Optional[str]]:
    """
    Generates a mindful response using Google's Gemini API, or returns a grounded fallback
    if GEMINI_API_KEY is not set or network fails.
    Returns (response_text, recommended_content_id).
    """
    api_key = settings.GEMINI_API_KEY
    
    # Try calling Google GenAI if key is present
    if api_key and api_key.strip():
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            
            # Format context with available practices so the AI can recommend one
            practice_context = "\n".join([
                f"- ID: {p.get('id')} | Title: {p.get('title')} | Type: {p.get('type')} | Summary: {p.get('summary')}"
                for p in available_practices[:6]
            ])
            
            augmented_system = f"{SYSTEM_PROMPT}\n\nAvailable practices in our app that you can recommend:\n{practice_context}\nIf one of these practices directly fits the user's struggle, mention its title naturally."

            # Construct message contents
            contents = []
            for h in recent_history[-6:]:
                role = "user" if h.get("role") == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h.get("message", ""))]))
            
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=augmented_system,
                    temperature=0.7,
                    max_output_tokens=600
                )
            )
            
            text = response.text
            
            # Check if any practice was mentioned
            recommended_id = None
            for p in available_practices:
                if p.get("title", "").lower() in text.lower():
                    recommended_id = p.get("id")
                    break

            return text, recommended_id

        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back to mindful template: {e}")

    # Empathetic Guru Fallback (Active when no API key is set yet)
    lower_msg = user_message.lower()
    recommended_id = None
    
    # Check for matched practice in library
    if available_practices:
        if "anxiet" in lower_msg or "stress" in lower_msg or "overwhelm" in lower_msg:
            match = next((p for p in available_practices if "anxiety" in p.get("title", "").lower() or "calm" in p.get("title", "").lower()), available_practices[0])
            recommended_id = match.get("id")
        elif "sleep" in lower_msg or "bed" in lower_msg or "night" in lower_msg:
            match = next((p for p in available_practices if "sleep" in p.get("title", "").lower() or "relax" in p.get("title", "").lower()), available_practices[0])
            recommended_id = match.get("id")
        else:
            recommended_id = available_practices[0].get("id")

    if any(w in lower_msg for w in ["anxious", "anxiety", "stressed", "overwhelm", "panic", "worried"]):
        reply = (
            "I hear how tight and crowded the space inside feels right now. Please know this: whatever you are feeling is completely welcome here. You do not need to fight it or fix it in this exact second.\n\n"
            "Let us take one gentle breath together right now. Inhale deeply through your nose, letting your belly soften... and then release a long, slow out-breath through parted lips with a soft sigh.\n\n"
            "Feel the support of the ground beneath your feet. Remember Tara Brach's teaching: *'The boundary to what we can accept is the boundary to our freedom.'* When you are ready, I invite you to try our guided practice on **Finding an Inner Refuge of Calm** or sit with the singing bowl timer for 5 quiet minutes."
        )
    elif any(w in lower_msg for w in ["sleep", "insomnia", "tired", "rest", "night"]):
        reply = (
            "The mind has been working hard for you all day, carrying thoughts, responsibilities, and memories. It is completely natural for it to still be spinning as night falls.\n\n"
            "Right now, let your eyes soften. Notice the contact of your body resting against the mattress or chair. You do not have to 'achieve' sleep; simply let sleep come to you like a warm tide.\n\n"
            "Try our **Basic Body Scan** practice tonight to gently release held tension from your forehead down to your toes."
        )
    elif any(w in lower_msg for w in ["focus", "distracted", "scattered", "work", "adhd"]):
        reply = (
            "When the mind scatters like autumn leaves in the wind, our first instinct is often frustration. Yet the moment you notice you are distracted, you are already awake and mindful.\n\n"
            "Bring your attention to just one anchor: the gentle cool sensation at the tip of your nostrils as you breathe in, and the warm sensation as you breathe out. Just this one breath, right here.\n\n"
            "A 10-minute session with our **Singing Bowl Bell Timer** is wonderful for gently training attention back to the present moment."
        )
    else:
        reply = (
            f"Welcome to this moment. In the midst of all the doing, planning, and striving of your day, taking a moment to pause is a radical act of self-care.\n\n"
            f"Close your eyes for three seconds, loosen your shoulders, and ask yourself gently: *'What is asking for my kind attention right now?'*\n\n"
            f"Whether you choose an unassisted singing bowl sit or an audio journey, I am here walking this path of awareness with you."
        )

    return reply, recommended_id
