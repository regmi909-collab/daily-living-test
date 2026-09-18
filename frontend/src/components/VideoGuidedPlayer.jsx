import React, { useState, useRef } from "react";
import { ArrowLeft, Play, Pause, Maximize, CheckCircle2, Clock, User, BookOpen } from "lucide-react";
import { api } from "../services/api";

export function VideoGuidedPlayer({ practice, onBack, onSessionCompleted }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    setHasCompleted(true);
    try {
      await api.logSession({
        content_id: practice.id,
        mode: "video_guided",
        duration_seconds: practice.duration_seconds || 480,
        completed: true,
        mood: "peaceful"
      });
      if (onSessionCompleted) onSessionCompleted();
    } catch (e) {
      console.error("Failed to log video session:", e);
    }
  };

  return (
    <div className="video-player-view">
      <button className="btn-ghost back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Back to Explore</span>
      </button>

      <div className="video-cinema-card glass-card">
        <div className="video-container">
          <video
            ref={videoRef}
            src={practice.media_url}
            poster={practice.thumbnail_url}
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleEnded}
            className="html5-video"
          />
        </div>

        <div className="video-details-body">
          <div className="video-meta">
            <span className="practice-badge">Guided Video Meditation</span>
            {practice.duration_seconds > 0 && (
              <span className="duration-badge">
                <Clock size={14} />
                <span>{Math.round(practice.duration_seconds / 60)} min</span>
              </span>
            )}
            {practice.teacher && (
              <span className="teacher-badge">
                <User size={14} />
                <span>{practice.teacher.name}</span>
              </span>
            )}
          </div>

          <h1 className="serif-heading video-title">{practice.title}</h1>
          <p className="video-summary">{practice.summary}</p>

          {hasCompleted && (
            <div className="session-logged-banner">
              <CheckCircle2 size={20} />
              <span>Video meditation completed and logged to your mindful journal!</span>
            </div>
          )}

          {practice.body_markdown && (
            <div className="video-reflection-box">
              <h3 className="serif-heading reflection-title">Practice Reflection</h3>
              <p>{practice.body_markdown}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .video-player-view {
          max-width: 880px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .video-cinema-card {
          overflow: hidden;
          padding: 0;
        }
        .video-container {
          position: relative;
          width: 100%;
          background: #000000;
          aspect-ratio: 16 / 9;
        }
        .html5-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .video-details-body {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .video-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .practice-badge {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent-gold);
          background: rgba(232, 193, 112, 0.15);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-weight: 600;
        }
        .duration-badge, .teacher-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .video-title {
          font-size: 2rem;
          line-height: 1.2;
        }
        .video-summary {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .session-logged-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: var(--accent-sage-soft);
          border: 1px solid var(--border-focus);
          color: var(--accent-sage);
          font-weight: 600;
          border-radius: var(--radius-sm);
        }
        .video-reflection-box {
          margin-top: 12px;
          padding: 18px;
          background: var(--bg-glass);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        .reflection-title {
          font-size: 1.2rem;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}
