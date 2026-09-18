import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Headphones, 
  Video, 
  Sliders, 
  Heart,
  Wind
} from "lucide-react";
import { playSingingBowlBell, startAmbientSound, stopAmbientSound } from "../services/audioEngine";
import { api } from "../services/api";

const DURATION_PRESETS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];

const AMBIENT_OPTIONS = [
  { id: "none", label: "Silent Sanctuary" },
  { id: "singing_bowl_drone", label: "Tibetan Bowl Drone" },
  { id: "rain", label: "Gentle Rain on Leaves" },
  { id: "stream", label: "Forest Stream" },
];

const MOOD_OPTIONS = [
  { id: "peaceful", emoji: "🕊️", label: "Peaceful" },
  { id: "grounded", emoji: "🌿", label: "Grounded" },
  { id: "clear", emoji: "✨", label: "Clear" },
  { id: "grateful", emoji: "🙏", label: "Grateful" },
  { id: "settled", emoji: "🌊", label: "Settled" },
];

export function TimerTracker({ onSessionLogged, onSelectAudioGuided, onSelectVideoGuided }) {
  // Mode: "bell_timer" | "audio_guided" | "video_guided"
  const [activeMode, setActiveMode] = useState("bell_timer");
  
  // Timer State
  const [targetSeconds, setTargetSeconds] = useState(600); // 10 mins default
  const [secondsRemaining, setSecondsRemaining] = useState(600);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [prepCountdown, setPrepCountdown] = useState(null); // 5s prep
  const [isCompleted, setIsCompleted] = useState(false);

  // Settings
  const [bellType, setBellType] = useState("medium"); // deep, medium, high
  const [intervalBellMins, setIntervalBellMins] = useState(0); // 0 = off, 5, 10
  const [ambientSound, setAmbientSound] = useState("singing_bowl_drone");
  const [enableBreathingGuide, setEnableBreathingGuide] = useState(true);

  // Post-session logging
  const [selectedMood, setSelectedMood] = useState("peaceful");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Breathing Phase: Inhale (4s), Hold (4s), Exhale (6s)
  const [breathPhase, setBreathPhase] = useState("Inhale...");
  const timerRef = useRef(null);
  const breathTimerRef = useRef(null);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (timerRef.current) clearInterval(timerRef.current);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, []);

  // Format MM:SS
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start Preparation Countdown -> Then Main Meditation
  const handleStart = () => {
    // Ring test / starting bowl chime
    playSingingBowlBell(bellType);

    if (ambientSound !== "none") {
      startAmbientSound(ambientSound, 0.35);
    }

    setPrepCountdown(5);
    let prepRemaining = 5;
    const prepInterval = setInterval(() => {
      prepRemaining -= 1;
      if (prepRemaining <= 0) {
        clearInterval(prepInterval);
        setPrepCountdown(null);
        startActualTimer();
      } else {
        setPrepCountdown(prepRemaining);
      }
    }, 1000);
  };

  const startActualTimer = () => {
    // Ring starting chime
    playSingingBowlBell(bellType);
    setIsActive(true);
    setIsPaused(false);
    setIsCompleted(false);

    // Start breathing cycle animation loop (4s inhale, 4s hold, 6s exhale = 14s total)
    if (enableBreathingGuide) {
      runBreathingCycle();
    }
  };

  const runBreathingCycle = () => {
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    
    let cycleSec = 0;
    setBreathPhase("Inhale gently...");

    breathTimerRef.current = setInterval(() => {
      cycleSec = (cycleSec + 1) % 14;
      if (cycleSec < 4) {
        setBreathPhase("Inhale gently through nose...");
      } else if (cycleSec < 8) {
        setBreathPhase("Hold in peaceful stillness...");
      } else {
        setBreathPhase("Exhale slowly and let go...");
      }
    }, 1000);
  };

  // Main Timer Tick
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }

          // Check interval bells
          const elapsed = targetSeconds - (prev - 1);
          if (intervalBellMins > 0 && elapsed > 0 && elapsed % (intervalBellMins * 60) === 0) {
            playSingingBowlBell("high");
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, targetSeconds, intervalBellMins]);

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      if (ambientSound !== "none") startAmbientSound(ambientSound, 0.35);
      if (enableBreathingGuide) runBreathingCycle();
    } else {
      setIsPaused(true);
      stopAmbientSound();
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      setBreathPhase("Paused");
    }
  };

  const handleReset = () => {
    stopAmbientSound();
    setIsActive(false);
    setIsPaused(false);
    setIsCompleted(false);
    setSecondsRemaining(targetSeconds);
    if (timerRef.current) clearInterval(timerRef.current);
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    setBreathPhase("Inhale...");
  };

  const handleTimerComplete = () => {
    stopAmbientSound();
    setIsActive(false);
    setIsPaused(false);
    setIsCompleted(true);
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);

    // Ring concluding bells (three gentle rings)
    playSingingBowlBell("deep");
    setTimeout(() => playSingingBowlBell("medium"), 2500);
  };

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      const elapsedSeconds = targetSeconds - secondsRemaining || targetSeconds;
      await api.logSession({
        mode: "bell_timer",
        duration_seconds: elapsedSeconds > 0 ? elapsedSeconds : targetSeconds,
        ambient_sound: ambientSound,
        completed: true,
        mood: selectedMood,
        notes: notes.trim() || undefined,
      });

      if (onSessionLogged) {
        onSessionLogged();
      }
      handleReset();
    } catch (err) {
      console.error("Error saving session:", err);
      alert("Session logged locally.");
      handleReset();
    } finally {
      setIsSaving(false);
    }
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, ((targetSeconds - secondsRemaining) / targetSeconds) * 100)
  );

  return (
    <div className="tracker-wrapper">
      {/* Mode Switcher Tabs */}
      <div className="tracker-mode-tabs glass-card">
        <button 
          className={`mode-btn ${activeMode === "bell_timer" ? "active" : ""}`}
          onClick={() => { setActiveMode("bell_timer"); handleReset(); }}
        >
          <Bell size={18} />
          <span>Singing Bowl Timer</span>
        </button>

        <button 
          className={`mode-btn ${activeMode === "audio_guided" ? "active" : ""}`}
          onClick={() => { setActiveMode("audio_guided"); onSelectAudioGuided?.(); }}
        >
          <Headphones size={18} />
          <span>Audio-Guided Sessions</span>
        </button>

        <button 
          className={`mode-btn ${activeMode === "video_guided" ? "active" : ""}`}
          onClick={() => { setActiveMode("video_guided"); onSelectVideoGuided?.(); }}
        >
          <Video size={18} />
          <span>Video Meditations</span>
        </button>
      </div>

      {/* Main Bell Ring Timer Studio */}
      {activeMode === "bell_timer" && (
        <div className="timer-studio glass-card">
          {!isCompleted ? (
            <>
              {/* Top Controls: Soundscapes & Singing Bowl options */}
              <div className="studio-header">
                <div className="preset-chips">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.seconds}
                      disabled={isActive}
                      className={`preset-btn ${targetSeconds === preset.seconds ? "selected" : ""}`}
                      onClick={() => {
                        setTargetSeconds(preset.seconds);
                        setSecondsRemaining(preset.seconds);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="sound-config-bar">
                  <div className="sound-select-wrapper">
                    <Volume2 size={16} className="icon-muted" />
                    <select
                      disabled={isActive}
                      value={ambientSound}
                      onChange={(e) => setAmbientSound(e.target.value)}
                      className="sound-dropdown"
                    >
                      {AMBIENT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    className="test-chime-btn btn-ghost"
                    onClick={() => playSingingBowlBell(bellType)}
                    title="Ring authentic Tibetan singing bowl bell"
                  >
                    <Bell size={15} />
                    <span>Test Bell</span>
                  </button>
                </div>
              </div>

              {/* Central Visual: Breathing Guide Circle & Ring Display */}
              <div className="visual-stage">
                {/* Breathing Ripple Waves */}
                {isActive && !isPaused && enableBreathingGuide && (
                  <>
                    <div className="breath-wave wave-1" />
                    <div className="breath-wave wave-2" />
                  </>
                )}

                {/* Circular Progress Ring */}
                <svg className="progress-ring" viewBox="0 0 320 320">
                  <circle
                    className="progress-ring-bg"
                    cx="160"
                    cy="160"
                    r="140"
                    strokeWidth="4"
                  />
                  <circle
                    className="progress-ring-fill"
                    cx="160"
                    cy="160"
                    r="140"
                    strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 140}
                    strokeDashoffset={2 * Math.PI * 140 * (1 - progressPercent / 100)}
                  />
                </svg>

                {/* Core Lotus / Orb */}
                <div className={`meditation-orb ${isActive && !isPaused ? "breathing" : ""}`}>
                  {prepCountdown !== null ? (
                    <div className="countdown-display">
                      <div className="prep-label">Settling In...</div>
                      <div className="prep-number">{prepCountdown}</div>
                    </div>
                  ) : (
                    <div className="time-display-container">
                      <div className="time-digits">{formatTime(secondsRemaining)}</div>
                      {isActive && (
                        <div className="breath-instruction">{breathPhase}</div>
                      )}
                      {!isActive && (
                        <div className="prompt-label">Ready for Presence</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="timer-controls">
                {!isActive ? (
                  <button className="btn-primary play-btn-large" onClick={handleStart}>
                    <Play size={22} fill="currentColor" />
                    <span>Begin Meditation</span>
                  </button>
                ) : (
                  <div className="active-controls">
                    <button className="btn-secondary control-btn" onClick={handlePauseResume}>
                      {isPaused ? <Play size={20} /> : <Pause size={20} />}
                      <span>{isPaused ? "Resume" : "Pause"}</span>
                    </button>
                    <button className="btn-ghost control-btn" onClick={handleReset}>
                      <RotateCcw size={18} />
                      <span>End & Reset</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Options & Micro-Practice toggle */}
              <div className="studio-footer">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={enableBreathingGuide}
                    onChange={(e) => setEnableBreathingGuide(e.target.checked)}
                  />
                  <Wind size={15} />
                  <span>Synchronized Breath Guidance (4-4-6 rhythm)</span>
                </label>
              </div>
            </>
          ) : (
            /* Post-Meditation Completion & Reflection Screen */
            <div className="completion-card">
              <div className="completion-icon-wrapper">
                <CheckCircle2 size={48} className="check-icon" />
              </div>
              <h2 className="serif-heading completion-title">Mindful Session Complete</h2>
              <p className="completion-desc">
                You dedicated <strong>{Math.round(targetSeconds / 60)} minutes</strong> to stillness and presence today.
              </p>

              {/* Mood Check-In */}
              <div className="mood-section">
                <div className="section-label">How do you feel in this moment?</div>
                <div className="mood-grid">
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.id}
                      className={`mood-btn ${selectedMood === mood.id ? "active" : ""}`}
                      onClick={() => setSelectedMood(mood.id)}
                    >
                      <span className="mood-emoji">{mood.emoji}</span>
                      <span className="mood-text">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reflection Notes */}
              <div className="notes-section">
                <textarea
                  className="reflection-input"
                  placeholder="Optional: Record a thought, insight, or note to self..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="completion-actions">
                <button
                  className="btn-primary log-btn"
                  disabled={isSaving}
                  onClick={handleSaveSession}
                >
                  <Sparkles size={18} />
                  <span>{isSaving ? "Saving to Journal..." : "Save to Mindful Journal"}</span>
                </button>
                <button className="btn-ghost" onClick={handleReset}>
                  Skip & Return
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded CSS */}
      <style>{`
        .tracker-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .tracker-mode-tabs {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 8px;
          border-radius: var(--radius-full);
          max-width: 680px;
          margin: 0 auto;
        }
        .mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          font-size: 0.92rem;
          font-weight: 500;
          transition: var(--transition-smooth);
        }
        .mode-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }
        .mode-btn.active {
          background: var(--accent-sage-soft);
          color: #A3E2BD;
          border: 1px solid rgba(91, 179, 129, 0.35);
        }
        .timer-studio {
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
          padding: 36px 30px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
        }
        .studio-header {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }
        .preset-chips {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .preset-btn {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          font-size: 0.85rem;
          font-weight: 500;
          transition: var(--transition-smooth);
        }
        .preset-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }
        .preset-btn.selected {
          background: var(--accent-sage);
          color: #FFFFFF;
          border-color: var(--accent-sage);
        }
        .sound-config-bar {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sound-select-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-glass);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }
        .sound-dropdown {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: var(--font-ui);
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
        }
        .sound-dropdown option {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .test-chime-btn {
          font-size: 0.82rem;
        }
        .visual-stage {
          position: relative;
          width: 300px;
          height: 300px;
          margin: 12px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .progress-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .progress-ring-bg {
          fill: transparent;
          stroke: var(--border-subtle);
        }
        .progress-ring-fill {
          fill: transparent;
          stroke: var(--accent-sage);
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
        }
        .meditation-orb {
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: var(--orb-gradient);
          border: 1px solid var(--orb-border);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-glow);
          transition: transform 3.5s ease-in-out, box-shadow 3.5s ease-in-out;
        }
        .meditation-orb.breathing {
          animation: breatheInhale 14s infinite ease-in-out;
        }
        .time-display-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .time-digits {
          font-family: var(--font-serif);
          font-size: 3.2rem;
          color: var(--time-digit-color);
          letter-spacing: 0.03em;
        }
        .breath-instruction {
          font-size: 0.85rem;
          color: var(--accent-sage);
          font-weight: 600;
          min-height: 20px;
          animation: fadeIn 0.4s ease;
        }
        .prompt-label {
          font-size: 0.82rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .countdown-display {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .prep-label {
          font-size: 0.85rem;
          color: var(--accent-gold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .prep-number {
          font-family: var(--font-serif);
          font-size: 4rem;
          color: var(--time-digit-color);
        }
        .breath-wave {
          position: absolute;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          border: 1px solid var(--orb-border);
          pointer-events: none;
        }
        .wave-1 {
          animation: ripple 6s infinite linear;
        }
        .wave-2 {
          animation: ripple 6s infinite linear 3s;
        }
        .timer-controls {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .play-btn-large {
          font-size: 1.1rem;
          padding: 14px 38px;
        }
        .active-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .control-btn {
          padding: 12px 24px;
        }
        .studio-footer {
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .toggle-label input {
          accent-color: var(--accent-sage);
        }

        /* Completion Card */
        .completion-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
        }
        .completion-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(91, 179, 129, 0.18);
          border: 1px solid rgba(91, 179, 129, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-sage);
        }
        .completion-title {
          font-size: 2rem;
          margin-bottom: -6px;
        }
        .completion-desc {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .mood-section {
          width: 100%;
          text-align: left;
        }
        .section-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .mood-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        .mood-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 6px;
          border-radius: var(--radius-sm);
          background: var(--bg-glass);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          transition: var(--transition-smooth);
        }
        .mood-btn:hover {
          background: var(--border-subtle);
        }
        .mood-btn.active {
          background: var(--accent-sage-soft);
          border-color: var(--accent-sage);
          color: var(--accent-sage);
          font-weight: 600;
        }
        .mood-emoji {
          font-size: 1.4rem;
        }
        .mood-text {
          font-size: 0.75rem;
        }
        .notes-section {
          width: 100%;
        }
        .reflection-input {
          width: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 12px;
          color: var(--text-primary);
          font-family: var(--font-ui);
          font-size: 0.9rem;
          resize: vertical;
          outline: none;
        }
        .reflection-input:focus {
          border-color: var(--border-focus);
        }
        .completion-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .log-btn {
          padding: 12px 28px;
        }

        @media (max-width: 600px) {
          .timer-studio {
            padding: 24px 16px;
          }
          .visual-stage {
            width: 260px;
            height: 260px;
          }
          .meditation-orb {
            width: 180px;
            height: 180px;
          }
          .time-digits {
            font-size: 2.5rem;
          }
          .mood-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
