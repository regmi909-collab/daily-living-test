from sqlalchemy.orm import Session
from app.models.models import Teacher, Tag, Content, User, UserStats

def seed_database_if_empty(db: Session):
    # Check if content already exists
    if db.query(Content).first():
        return

    # 1. Create Teachers
    tara = Teacher(
        name="Tara Brach, Ph.D.",
        bio="Clinical psychologist, author of Radical Acceptance, and internationally recognized teacher of mindfulness and meditation.",
        avatar_url="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    )
    jon = Teacher(
        name="Jon Kabat-Zinn, Ph.D.",
        bio="Professor of Medicine Emeritus and creator of Mindfulness-Based Stress Reduction (MBSR).",
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    )
    jack = Teacher(
        name="Jack Kornfield",
        bio="Buddhist practitioner, psychologist, and founding teacher of the Insight Meditation Society.",
        avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    )
    db.add_all([tara, jon, jack])
    db.flush()

    # 2. Create Tags
    tag_anxiety = Tag(name="Anxiety & Stress", slug="anxiety-stress", color_hex="#E07A5F")
    tag_sleep = Tag(name="Sleep Wisdom", slug="sleep-wisdom", color_hex="#3D405B")
    tag_breath = Tag(name="Mindful Breath", slug="mindful-breath", color_hex="#81B29A")
    tag_body = Tag(name="Body Scan", slug="body-scan", color_hex="#F2CC8F")
    tag_rain = Tag(name="R.A.I.N. Method", slug="rain-method", color_hex="#9C6644")
    tag_metta = Tag(name="Loving-Kindness", slug="loving-kindness", color_hex="#6D597A")
    
    db.add_all([tag_anxiety, tag_sleep, tag_breath, tag_body, tag_rain, tag_metta])
    db.flush()

    # 3. Create Guided Audio Meditations (Using royalty-free high quality ambient audio streams)
    m1 = Content(
        type="audio_meditation",
        title="Inner Refuge of Calm",
        slug="inner-refuge-of-calm",
        summary="Explore the possibility of finding an inner sanctuary—an unwavering presence that holds whatever is moving through your life.",
        body_markdown="""### Practice Guidance
In this meditation, we gently turn inward to discover that beneath the changing tides of thought and anxiety lies an undisturbed calm.

#### Reflections & Steps:
1. **Arriving in the Body**: Feel the seat beneath you and let your spine settle into an alert, dignified, yet soft posture.
2. **The Anchor of the Breath**: Notice where you feel the breath most distinctly—the tip of the nose, the rise of the chest, or the gentle expanding of the belly.
3. **Resting in the Gap**: Between each in-breath and out-breath is a quiet pause. Allow yourself to rest there.
4. **Softening Resistance**: When tight thoughts arise, whisper inwardly: *'This too is welcome.'*""",
        media_url="https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg",
        thumbnail_url="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80",
        duration_seconds=1200, # 20 mins
        teacher_id=tara.id,
        is_published=True
    )
    m1.tags.extend([tag_anxiety, tag_breath])

    m2 = Content(
        type="audio_meditation",
        title="Basic Mindful Body Scan",
        slug="basic-mindful-body-scan",
        summary="A deeply nourishing pathway into presence—awakening tactile awareness through the living sensations of your body.",
        body_markdown="""### Body Scan Instructions
Bringing a kind and gentle attention through each region of your body. Moving slowly from the crown of your head to the soles of your feet.

- **Forehead & Brow**: Soften any furrow or mental fatigue.
- **Jaw & Tongue**: Release clenched teeth; let the mouth be softly slack.
- **Shoulders**: Drop them away from the ears like heavy silk.
- **Hands & Feet**: Sense the tingling, warmth, and vibrant aliveness resting in your extremities.""",
        media_url="https://actions.google.com/sounds/v1/ambiences/meadow_morning.ogg",
        thumbnail_url="https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=600&auto=format&fit=crop&q=80",
        duration_seconds=600, # 10 mins
        teacher_id=jon.id,
        is_published=True
    )
    m2.tags.extend([tag_body, tag_sleep])

    m3 = Content(
        type="audio_meditation",
        title="Calming Anxiety with R.A.I.N.",
        slug="calming-anxiety-with-rain",
        summary="Tara Brach's signature 4-step framework for transforming difficult emotions into compassion and awakening.",
        body_markdown="""### The R.A.I.N. Protocol
When a difficult emotion or anxious wave strikes:

1. **R — Recognize**: Notice what is happening inside (*'Anxiety is here'*, *'Fear is present'*).
2. **A — Allow**: Let the feeling simply be there without fighting it or pushing it away (*'Yes'*, *'This belongs'*).
3. **I — Investigate with Kindness**: Where is this feeling in your body? Is there tightness in the throat, chest, or stomach?
4. **N — Nurture with Self-Compassion**: Place a hand gently over your heart and send care to the part of you that feels scared.""",
        media_url="https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg",
        thumbnail_url="https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=600&auto=format&fit=crop&q=80",
        duration_seconds=720, # 12 mins
        teacher_id=tara.id,
        is_published=True
    )
    m3.tags.extend([tag_anxiety, tag_rain, tag_metta])

    # 4. Create Video Meditations
    v1 = Content(
        type="video_meditation",
        title="Morning Radiance & Centering Practice",
        slug="morning-radiance-centering",
        summary="Start your day aligned with intention, gentle posture alignment, and a clear, spacious heart.",
        body_markdown="""Watch and follow along as Jack Kornfield guides you through opening the chest, centering the breath, and setting a mindful compass for the day ahead.""",
        media_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=600&auto=format&fit=crop&q=80",
        duration_seconds=480, # 8 mins
        teacher_id=jack.id,
        is_published=True
    )
    v1.tags.extend([tag_breath, tag_metta])

    v2 = Content(
        type="video_meditation",
        title="Evening Release & Candlelight Presence",
        slug="evening-release-candlelight",
        summary="A visual, ambient meditation to unwind the nervous system and prepare the mind for deep, restorative sleep.",
        body_markdown="""Unwind by candlelight. Rest your gaze softly on the flickering light as the instructions guide you to surrender all tasks of the day.""",
        media_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnail_url="https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80",
        duration_seconds=900, # 15 mins
        teacher_id=tara.id,
        is_published=True
    )
    v2.tags.extend([tag_sleep, tag_body])

    # 5. Create Blog Posts (Mindful.org style)
    b1 = Content(
        type="blog_post",
        title="How Mindfulness Rewires the Anxious Brain: The Science of the Sacred Pause",
        slug="mindfulness-rewires-anxious-brain",
        summary="Neuroscience reveals why pausing for just 60 seconds shifts brain activity from amygdala reactivity to prefrontal clarity.",
        body_markdown="""When we experience anxiety or acute stress, the brain's alarm center—the amygdala—floods our bloodstream with cortisol and adrenaline. In evolutionary biology, this was essential for surviving predators. But in modern everyday life, an overflowing email inbox or a critical remark triggers the exact same fight-or-flight cascade.

### What Happens in the 'Sacred Pause'?
As Dr. Jon Kabat-Zinn often reminds us:
> *"You cannot stop the waves, but you can learn to surf."*

When you pause for even three mindful breaths:
1. **Vagal Tone Stimulation**: The slow exhalation activates the parasympathetic nervous system via the vagus nerve, sending an immediate chemical signal to the heart to decelerate.
2. **Prefrontal Re-engagement**: Blood flow shifts back to the dorsolateral prefrontal cortex, restoring perspective, creative problem-solving, and emotional regulation.
3. **Defusing Rumination**: Instead of *being* the anxiety, you become the compassionate observer of the sensation.

### Try This 30-Second Micro-Checkin:
Whenever you feel panic or overwhelm creeping in:
- Stop moving your hands or phone.
- Exhale completely, emptying all stale air from your lungs.
- Whisper softly inside: *"In this moment, I am safe."*""",
        thumbnail_url="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
        duration_seconds=0,
        teacher_id=jon.id,
        is_published=True
    )
    b1.tags.extend([tag_anxiety, tag_breath])

    b2 = Content(
        type="blog_post",
        title="The R.A.I.N. Protocol: 4 Steps to Free Yourself from Emotional Reactivity",
        slug="the-rain-protocol-four-steps",
        summary="A deep dive into Tara Brach's transformative method for working through shame, anger, and grief with self-compassion.",
        body_markdown="""We often spend our lives running from unpleasant feelings. When sadness, jealousy, or inadequacy arise, we instinctively reach for our phones, food, or busywork to numb the discomfort.

The acronym **R.A.I.N.** provides an easy-to-remember parachute whenever emotional turbulence threatens to overwhelm you.

---

### Step 1: Recognize (R)
Simply acknowledge what is happening right here. Without judging yourself, label the emotion: *"I am feeling overlooked"*, *"Anger is rising"*, or *"My chest feels constricted."*

### Step 2: Allow (A)
This is the radical step: give the feeling permission to be here. You don't have to like it, endorse it, or want it to stay forever. You are simply saying: *"For this brief moment, I allow this feeling to breathe."*

### Step 3: Investigate (I)
Ask with genuine curiosity, not analytical diagnosis:
- *Where in my body is this feeling lodged?*
- *What is this emotion believing about me?* (e.g. "I am not enough", "I will fail")
- *What does this vulnerability most need right now?*

### Step 4: Nurture (N)
Offer yourself kindness. Place a warm hand on your chest, your cheek, or your solar plexus. Say to yourself whatever words a loving parent or wise mentor would whisper: *"You are doing your best. I am here with you. It is going to be okay."*

---
*Practice RAIN regularly, and you will notice that emotions stop owning you—instead, they become gateways to compassion.*""",
        thumbnail_url="https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&auto=format&fit=crop&q=80",
        duration_seconds=0,
        teacher_id=tara.id,
        is_published=True
    )
    b2.tags.extend([tag_rain, tag_anxiety, tag_metta])

    db.add_all([m1, m2, m3, v1, v2, b1, b2])

    # 6. Create Demo User with Sample Stats for Instant Demo Exploration
    demo_user = User(
        email="mindful.seeker@meditationguru.app",
        display_name="Mindful Seeker",
        photo_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        google_id="demo_google_id_1001",
        is_admin=True
    )
    db.add(demo_user)
    db.flush()

    stats = UserStats(
        user_id=demo_user.id,
        current_streak_days=5,
        longest_streak_days=12,
        total_minutes_meditated=145,
        total_sessions_count=8
    )
    db.add(stats)

    db.commit()
