import React, { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Clock, 
  User, 
  CheckCircle2, 
  BookOpen, 
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { api } from "../services/api";

export function AudioGuidedPlayer({ practice, onBack, onSessionCompleted }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(practice.duration_seconds || 600);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    // Reset on practice change
    setIsPlaying(false);
    setCurrentTime(0);
    setHasCompleted(false);
  }, [practice]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const skipTime = (seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    setHasCompleted(true);
    try {
      await api.logSession({
        content_id: practice.id,
        mode: "audio_guided",
        duration_seconds: Math.round(duration),
        completed: true,
        mood: "peaceful"
      });
      if (onSessionCompleted) onSessionCompleted();
    } catch (e) {
      console.error("Failed to log audio session:", e);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="audio-player-view">
      {/* Back button */}
      <button className="btn-ghost back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Back to Explore</span>
      </button>

      {/* Main Player Card */}
      <div className="player-hero-card glass-card">
        <div className="player-meta-top">
          <div className="practice-type-tag">Guided Audio Practice</div>
          {practice.teacher && (
            <div className="teacher-badge">
              {practice.teacher.avatar_url && (
                <img src={practice.teacher.avatar_url} alt={practice.teacher.name} className="teacher-thumb" />
              )}
              <span>With {practice.teacher.name}</span>
            </div>
          )}
        </div>

        <h1 className="serif-heading practice-title">{practice.title}</h1>
        <p className="practice-summary">{practice.summary}</p>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={practice.media_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={handleEnded}
        />

        {/* Waveform Scrubber */}
        <div className="scrubber-container">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime}
            onChange={handleSeek}
            className="time-slider"
          />
          <div className="time-labels">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="player-controls-row">
          <button className="btn-ghost speed-btn" onClick={() => changeSpeed(playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1.0)}>
            {playbackSpeed}x
          </button>

          <div className="core-controls">
            <button className="btn-ghost skip-btn" onClick={() => skipTime(-15)} title="Back 15s">
              <RotateCcw size={22} />
              <span className="skip-number">15</span>
            </button>

            <button className="btn-primary play-main-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
            </button>

            <button className="btn-ghost skip-btn" onClick={() => skipTime(15)} title="Forward 15s">
              <RotateCw size={22} />
              <span className="skip-number">15</span>
            </button>
          </div>

          <button className="btn-ghost" onClick={() => {
            setIsMuted(!isMuted);
            if (audioRef.current) audioRef.current.muted = !isMuted;
          }}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {hasCompleted && (
          <div className="session-logged-banner">
            <CheckCircle2 size={20} />
            <span>Practice complete! Mindful minutes added to your dashboard.</span>
          </div>
        )}
      </div>

      {/* Teacher Bio & Guidance Reflection */}
      {practice.body_markdown && (
        <div className="transcript-section glass-card">
          <div className="section-header-toggle" onClick={() => setShowTranscript(!showTranscript)}>
            <div className="toggle-title">
              <BookOpen size={18} />
              <span className="serif-heading">Practice Reflections & Notes</span>
            </div>
            <button className="btn-ghost text-btn">{showTranscript ? "Hide" : "Show"}</button>
          </div>

          {showTranscript && (
            <div className="transcript-content">
              <div dangerouslySetInnerHTML={{ 
                __html: practice.body_markdown
                  .replace(/### (.*)/g, '<h3 class="serif-heading">$1</h3>')
                  .replace(/#### (.*)/g, '<h4>$1</h4>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n\n/g, '<br/><br/>')
              }} />
            </div>
          )}
        </div>
      )}

      {/* Embedded Styles */}
      <style>{`
        .audio-player-view {
          max-width: 780px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .back-btn {
          align-self: flex-start;
          margin-bottom: 4px;
        }
        .player-hero-card {
          padding: 36px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .player-meta-top {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .practice-type-tag {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent-sage);
          background: var(--accent-sage-soft);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-weight: 600;
        }
        .teacher-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .teacher-thumb {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          object-fit: cover;
        }
        .practice-title {
          font-size: 2.2rem;
          max-width: 600px;
          line-height: 1.2;
        }
        .practice-summary {
          font-size: 1rem;
          color: var(--text-secondary);
          max-width: 580px;
          line-height: 1.6;
        }
        .scrubber-container {
          width: 100%;
          max-width: 540px;
          margin-top: 10px;
        }
        .time-slider {
          width: 100%;
          height: 6px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          accent-color: var(--accent-sage);
          cursor: pointer;
        }
        .time-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 6px;
        }
        .player-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 500px;
          margin-top: 8px;
        }
        .core-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .play-main-btn {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .skip-btn {
          position: relative;
          padding: 10px;
        }
        .skip-number {
          position: absolute;
          font-size: 0.62rem;
          font-weight: 700;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .speed-btn {
          font-weight: 600;
          font-size: 0.88rem;
          width: 50px;
        }
        .session-logged-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(91, 179, 129, 0.15);
          border: 1px solid rgba(91, 179, 129, 0.35);
          color: #A3E2BD;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          margin-top: 10px;
          animation: fadeIn 0.3s ease;
        }
        .transcript-section {
          padding: 24px 30px;
        }
        .section-header-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .toggle-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.25rem;
          color: var(--text-heading);
        }
        .transcript-content {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          line-height: 1.8;
          font-size: 0.95rem;
        }
        .transcript-content h3 {
          margin: 16px 0 8px;
          font-size: 1.25rem;
          color: var(--text-heading);
        }
        .transcript-content h4 {
          margin: 12px 0 6px;
          font-size: 1rem;
          color: var(--accent-gold);
        }
      `}</style>
    </div>
  );
}
