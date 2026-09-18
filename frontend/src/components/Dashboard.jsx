import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Clock, 
  Award, 
  Calendar, 
  Play, 
  Sparkles, 
  Bell, 
  Headphones, 
  Video,
  CheckCircle,
  Compass,
  ArrowRight
} from "lucide-react";
import { api } from "../services/api";

const MINDFUL_QUOTES = [
  "“You cannot stop the waves, but you can learn to surf.” — Jon Kabat-Zinn",
  "“The boundary to what we can accept is the boundary to our freedom.” — Tara Brach",
  "“In the midst of movement and chaos, keep stillness inside of you.” — Deepak Chopra",
  "“Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.” — Thich Nhat Hanh"
];

export function Dashboard({ onStartMeditation, onExplorePractices }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteIndex] = useState(() => Math.floor(Math.random() * MINDFUL_QUOTES.length));

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.warn("Using local fallback stats:", e);
      // Fallback preview data
      setStats({
        current_streak_days: 5,
        longest_streak_days: 12,
        total_minutes_meditated: 145,
        total_sessions_count: 8,
        weekly_activity: [
          { day: "Mon", date: "2026-09-12", minutes: 10, sessions_count: 1 },
          { day: "Tue", date: "2026-09-13", minutes: 20, sessions_count: 1 },
          { day: "Wed", date: "2026-09-14", minutes: 15, sessions_count: 1 },
          { day: "Thu", date: "2026-09-15", minutes: 30, sessions_count: 2 },
          { day: "Fri", date: "2026-09-16", minutes: 20, sessions_count: 1 },
          { day: "Sat", date: "2026-09-17", minutes: 25, sessions_count: 1 },
          { day: "Sun", date: "2026-09-18", minutes: 25, sessions_count: 1 },
        ],
        badges: [
          { id: "first_step", title: "First Step", description: "Completed your first session", icon: "🌱", achieved: true },
          { id: "streak_3", title: "3-Day Rhythm", description: "3 consecutive mindful days", icon: "🔥", achieved: true },
          { id: "streak_7", title: "7-Day Zen Master", description: "A continuous full week", icon: "🧘", achieved: false },
          { id: "minutes_60", title: "Golden Hour", description: "60 total mindful minutes", icon: "⏳", achieved: true },
          { id: "minutes_300", title: "Deep Stillness", description: "300 minutes meditated", icon: "🌊", achieved: false },
        ],
        recent_sessions: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Gathering your mindful presence...</p>
      </div>
    );
  }

  const maxWeeklyMinutes = Math.max(1, ...((stats?.weekly_activity || []).map((d) => d.minutes)));

  return (
    <div className="dashboard-container">
      {/* Hero Welcome Card with Daily Quote */}
      <div className="hero-quote-card glass-card">
        <div className="hero-content">
          <div className="streak-indicator-chip">
            <Flame size={18} className="flame-pulse" />
            <span>{stats?.current_streak_days || 0}-Day Mindful Streak</span>
          </div>
          <h1 className="serif-heading hero-title">Welcome Home to Stillness</h1>
          <p className="hero-quote">{MINDFUL_QUOTES[quoteIndex]}</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={onStartMeditation}>
              <Play size={18} fill="currentColor" />
              <span>Begin Today's Practice</span>
            </button>
            <button className="btn-secondary" onClick={onExplorePractices}>
              <Compass size={18} />
              <span>Explore Guided Journeys</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-metric-grid">
        <div className="metric-card glass-card">
          <div className="metric-icon-box flame">
            <Flame size={24} />
          </div>
          <div className="metric-body">
            <div className="metric-value">{stats?.current_streak_days || 0} <span className="unit">days</span></div>
            <div className="metric-label">Current Streak</div>
            <div className="metric-sub">Longest: {stats?.longest_streak_days || 0} days</div>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-box clock">
            <Clock size={24} />
          </div>
          <div className="metric-body">
            <div className="metric-value">{stats?.total_minutes_meditated || 0} <span className="unit">min</span></div>
            <div className="metric-label">Total Stillness</div>
            <div className="metric-sub">Accumulated mindful time</div>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-box bowl">
            <Bell size={24} />
          </div>
          <div className="metric-body">
            <div className="metric-value">{stats?.total_sessions_count || 0} <span className="unit">sessions</span></div>
            <div className="metric-label">Practices Logged</div>
            <div className="metric-sub">Bell, audio & video sits</div>
          </div>
        </div>
      </div>

      {/* Two Columns: 7-Day Activity Chart & Milestone Badges */}
      <div className="dashboard-columns-grid">
        {/* Weekly Bar Chart */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3 className="serif-heading chart-title">7-Day Mindfulness Activity</h3>
            <span className="chart-sub">Minutes meditated this week</span>
          </div>

          <div className="bar-chart-container">
            {stats?.weekly_activity?.map((day) => {
              const heightPercent = Math.max(8, (day.minutes / maxWeeklyMinutes) * 100);
              const isToday = new Date(day.date).toDateString() === new Date().toDateString();

              return (
                <div key={day.date} className="bar-column">
                  <div className="bar-tooltip">{day.minutes}m</div>
                  <div className="bar-track">
                    <div 
                      className={`bar-fill ${isToday ? "today" : ""}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className={`bar-day-label ${isToday ? "today-label" : ""}`}>
                    {day.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Badges */}
        <div className="badges-card glass-card">
          <div className="badges-header">
            <h3 className="serif-heading chart-title">Mindful Milestones</h3>
            <span className="chart-sub">Consistency & growth</span>
          </div>

          <div className="badges-list">
            {stats?.badges?.map((badge) => (
              <div 
                key={badge.id} 
                className={`badge-item ${badge.achieved ? "achieved" : "locked"}`}
              >
                <div className="badge-icon-bubble">{badge.icon}</div>
                <div className="badge-details">
                  <div className="badge-title">{badge.title}</div>
                  <div className="badge-desc">{badge.description}</div>
                </div>
                {badge.achieved && (
                  <CheckCircle size={18} className="badge-check" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions History */}
      {stats?.recent_sessions && stats.recent_sessions.length > 0 && (
        <div className="recent-sessions-card glass-card">
          <h3 className="serif-heading section-title">Recent Mindful Journal</h3>
          <div className="sessions-table">
            {stats.recent_sessions.map((sess) => {
              const dateFormatted = new Date(sess.started_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div key={sess.id} className="session-row">
                  <div className="session-type-icon">
                    {sess.mode === "bell_timer" ? <Bell size={16} /> : sess.mode === "video_guided" ? <Video size={16} /> : <Headphones size={16} />}
                  </div>
                  <div className="session-info">
                    <div className="session-title">
                      {sess.content?.title || (sess.mode === "bell_timer" ? "Tibetan Singing Bowl Meditation" : "Guided Practice")}
                    </div>
                    <div className="session-timestamp">{dateFormatted}</div>
                  </div>
                  {sess.mood && (
                    <div className="session-mood-chip">
                      Mood: {sess.mood}
                    </div>
                  )}
                  <div className="session-duration">
                    {Math.round(sess.duration_seconds / 60)} min
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .hero-quote-card {
          padding: 38px 36px;
          background: radial-gradient(circle at 80% 20%, var(--accent-sage-soft) 0%, var(--bg-card) 70%);
          border-color: var(--border-focus);
        }
        .hero-content {
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .streak-indicator-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(186, 78, 50, 0.1);
          color: var(--accent-coral);
          border: 1px solid rgba(186, 78, 50, 0.25);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          align-self: flex-start;
        }
        .flame-pulse {
          color: var(--accent-coral);
          animation: pulseGlow 2s infinite ease-in-out;
        }
        .hero-title {
          font-size: 2.6rem;
          line-height: 1.15;
        }
        .hero-quote {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-style: italic;
          color: var(--text-primary);
          line-height: 1.6;
        }
        .hero-actions {
          display: flex;
          gap: 14px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .stats-metric-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .metric-card {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .metric-icon-box {
          width: 54px;
          height: 54px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .metric-icon-box.flame {
          background: rgba(186, 78, 50, 0.12);
          color: var(--accent-coral);
          border: 1px solid rgba(186, 78, 50, 0.25);
        }
        .metric-icon-box.clock {
          background: var(--accent-sage-soft);
          color: var(--accent-sage);
          border: 1px solid var(--border-focus);
        }
        .metric-icon-box.bowl {
          background: rgba(168, 110, 18, 0.12);
          color: var(--accent-gold);
          border: 1px solid rgba(168, 110, 18, 0.25);
        }
        .metric-value {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 500;
          color: var(--text-heading);
          line-height: 1;
        }
        .metric-value .unit {
          font-family: var(--font-ui);
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 400;
        }
        .metric-label {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-top: 4px;
        }
        .metric-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .dashboard-columns-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .chart-card, .badges-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .chart-title {
          font-size: 1.4rem;
        }
        .chart-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .bar-chart-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 180px;
          padding-top: 24px;
        }
        .bar-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          flex: 1;
          position: relative;
        }
        .bar-tooltip {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .bar-track {
          flex: 1;
          width: 22px;
          background: var(--border-subtle);
          border-radius: var(--radius-full);
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .bar-fill {
          width: 100%;
          background: var(--accent-sage);
          border-radius: var(--radius-full);
          transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bar-fill.today {
          background: linear-gradient(180deg, var(--accent-gold) 0%, var(--accent-sage) 100%);
          box-shadow: 0 0 14px rgba(168, 110, 18, 0.4);
        }
        .bar-day-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 8px;
        }
        .bar-day-label.today-label {
          color: var(--accent-gold);
          font-weight: 600;
        }
        .badges-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .badge-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          background: var(--bg-glass);
          border: 1px solid var(--border-subtle);
          transition: var(--transition-smooth);
        }
        .badge-item.achieved {
          background: var(--accent-sage-soft);
          border-color: var(--border-focus);
        }
        .badge-item.locked {
          opacity: 0.5;
        }
        .badge-icon-bubble {
          font-size: 1.4rem;
        }
        .badge-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-heading);
        }
        .badge-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .badge-check {
          color: var(--accent-sage);
          margin-left: auto;
        }
        .recent-sessions-card {
          padding: 28px;
        }
        .section-title {
          font-size: 1.4rem;
          margin-bottom: 16px;
        }
        .sessions-table {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .session-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: var(--bg-glass);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
        }
        .session-type-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-sage-soft);
          color: var(--accent-sage);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .session-info {
          flex: 1;
        }
        .session-title {
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--text-heading);
        }
        .session-timestamp {
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .session-mood-chip {
          font-size: 0.78rem;
          background: var(--border-subtle);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }
        .session-duration {
          font-weight: 600;
          color: var(--accent-sage);
          font-size: 0.95rem;
        }

        @media (max-width: 850px) {
          .stats-metric-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-columns-grid {
            grid-template-columns: 1fr;
          }
          .hero-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
