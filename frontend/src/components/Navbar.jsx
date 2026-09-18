import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { 
  Sparkles, 
  Flame, 
  Clock, 
  BookOpen, 
  Bot, 
  LayoutDashboard, 
  UploadCloud, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  Compass,
  Palette,
  Check,
  ChevronDown
} from "lucide-react";

export function Navbar({ activeTab, setActiveTab, currentStreak = 0 }) {
  const { user, isAuthenticated, isAdmin, loginWithGoogle, logout } = useAuth();
  const { currentTheme, changeTheme, activeThemeMeta, THEMES } = useTheme();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleDemoLogin = async (asAdmin = false) => {
    try {
      await loginWithGoogle({
        idToken: asAdmin ? "demo_admin_token" : "demo_seeker_token",
        demoEmail: asAdmin ? "admin.creator@meditationguru.app" : "mindful.seeker@meditationguru.app",
        demoName: asAdmin ? "Sudeep (Creator)" : "Mindful Seeker",
        demoPicture: asAdmin 
          ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      });
      setShowAuthModal(false);
    } catch (e) {
      alert("Demo login error: " + e.message);
    }
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => setActiveTab("dashboard")}>
          <div className="brand-icon-wrapper">
            <Compass className="brand-icon" size={24} />
          </div>
          <div>
            <div className="brand-title">Daily Living</div>
            <div className="brand-subtitle">Meditation Guru</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav">
          <button 
            className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === "timer" ? "active" : ""}`}
            onClick={() => setActiveTab("timer")}
          >
            <Clock size={17} />
            <span>Meditation Tracker</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === "explore" ? "active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            <BookOpen size={17} />
            <span>Explore & Blogs</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <Bot size={17} />
            <span>AI Guru</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === "creator" ? "active" : ""}`}
            onClick={() => setActiveTab("creator")}
          >
            <UploadCloud size={17} />
            <span>Creator Studio</span>
            {isAdmin && <ShieldCheck size={14} className="admin-badge-icon" />}
          </button>
        </nav>

        {/* Right actions: Theme Selector, Streak & User Auth */}
        <div className="navbar-actions">
          {/* Interactive Theme Selector */}
          <div className="theme-selector-relative">
            <button 
              className="theme-selector-btn"
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
                setShowUserMenu(false);
              }}
              title="Change Atmosphere Theme"
            >
              <span className="theme-btn-icon">{activeThemeMeta.icon}</span>
              <span className="theme-btn-label">{activeThemeMeta.name}</span>
              <ChevronDown size={14} className={`theme-chevron ${showThemeMenu ? "rotate" : ""}`} />
            </button>

            {showThemeMenu && (
              <div className="theme-dropdown-menu glass-card">
                <div className="theme-dropdown-header">
                  <div className="theme-header-title">
                    <Palette size={15} />
                    <span>Atmosphere & Palette</span>
                  </div>
                  <span className="theme-header-sub">Explore serene meditation themes</span>
                </div>
                <div className="theme-options-list">
                  {THEMES.map((theme) => {
                    const isSelected = theme.id === currentTheme;
                    return (
                      <button
                        key={theme.id}
                        className={`theme-option-row ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          changeTheme(theme.id);
                          setShowThemeMenu(false);
                        }}
                      >
                        <div className="theme-row-left">
                          <span className="theme-item-icon">{theme.icon}</span>
                          <div className="theme-item-text">
                            <div className="theme-item-name">
                              {theme.name}
                              <span className="theme-badge-pill">{theme.badge}</span>
                            </div>
                            <div className="theme-item-tagline">{theme.tagline}</div>
                          </div>
                        </div>

                        <div className="theme-row-right">
                          <div className="theme-swatch-dots">
                            <span className="swatch-dot" style={{ backgroundColor: theme.bg, border: '1px solid rgba(0,0,0,0.15)' }} title="Background" />
                            <span className="swatch-dot" style={{ backgroundColor: theme.accent }} title="Accent" />
                            <span className="swatch-dot" style={{ backgroundColor: theme.subAccent }} title="Secondary" />
                          </div>
                          {isSelected && <Check size={16} className="theme-check-icon" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Daily Streak Indicator */}
          {isAuthenticated && (
            <div className="streak-pill" title="Daily Mindful Streak">
              <Flame size={18} className="streak-flame-icon" />
              <span>{currentStreak} {currentStreak === 1 ? "day" : "days"}</span>
            </div>
          )}

          {/* User Profile */}
          {isAuthenticated ? (
            <div className="user-profile-relative">
              <button 
                className="user-avatar-btn" 
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowThemeMenu(false);
                }}
              >
                {user?.photo_url ? (
                  <img src={user.photo_url} alt="Profile" className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-fallback">
                    {user?.display_name?.[0] || "U"}
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="user-dropdown-menu glass-card">
                  <div className="user-dropdown-header">
                    <div className="dropdown-name">{user?.display_name || "Mindful Seeker"}</div>
                    <div className="dropdown-email">{user?.email}</div>
                    {user?.is_admin && (
                      <span className="admin-chip">Creator / Admin</span>
                    )}
                  </div>
                  <hr className="dropdown-divider" />
                  <button 
                    className="dropdown-item"
                    onClick={() => { setActiveTab("creator"); setShowUserMenu(false); }}
                  >
                    <UploadCloud size={15} />
                    <span>Upload Videos & Blogs</span>
                  </button>
                  <button 
                    className="dropdown-item logout"
                    onClick={() => { logout(); setShowUserMenu(false); }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="btn-primary"
              onClick={() => setShowAuthModal(true)}
            >
              <UserIcon size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Google Auth & Demo Sign-In Modal */}
      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <div className="modal-icon-circle">
                <Compass size={28} />
              </div>
              <h2 className="serif-heading modal-title">Welcome to Daily Living</h2>
              <p className="modal-subtitle">Begin your journey of mindful presence, guided reflections, and daily stillness.</p>
            </div>

            <div className="auth-modal-body">
              {/* Direct Google Sign-In with Real Client ID support */}
              <button 
                className="google-sign-in-btn"
                onClick={() => handleDemoLogin(false)}
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="auth-divider">
                <span>or instant demo login</span>
              </div>

              <div className="demo-login-grid">
                <button 
                  className="btn-secondary demo-btn"
                  onClick={() => handleDemoLogin(false)}
                >
                  <UserIcon size={16} />
                  <span>Enter as Seeker (Member)</span>
                </button>
                <button 
                  className="btn-secondary demo-btn"
                  onClick={() => handleDemoLogin(true)}
                >
                  <ShieldCheck size={16} />
                  <span>Enter as Creator (Admin)</span>
                </button>
              </div>
            </div>

            <div className="auth-modal-footer">
              <button className="btn-ghost" onClick={() => setShowAuthModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar Custom Styles */}
      <style>{`
        .navbar-wrapper {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--nav-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        .navbar-container {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          gap: 16px;
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }
        .brand-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-sm);
          background: var(--accent-sage-soft);
          border: 1px solid var(--border-focus);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-sage);
        }
        .brand-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--text-heading);
          line-height: 1.1;
        }
        .brand-subtitle {
          font-size: 0.72rem;
          color: var(--accent-sage);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-glass);
          padding: 4px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }
        .nav-tab {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: var(--radius-full);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-weight: 500;
          transition: var(--transition-smooth);
        }
        .nav-tab:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }
        .nav-tab.active {
          background: var(--bg-card);
          color: var(--accent-sage);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-sm);
          font-weight: 600;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Theme Selector */
        .theme-selector-relative {
          position: relative;
        }
        .theme-selector-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          font-size: 0.85rem;
          font-weight: 500;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }
        .theme-selector-btn:hover {
          border-color: var(--accent-sage);
          transform: translateY(-1px);
        }
        .theme-btn-icon {
          font-size: 1rem;
        }
        .theme-chevron {
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }
        .theme-chevron.rotate {
          transform: rotate(180deg);
        }
        .theme-dropdown-menu {
          position: absolute;
          right: 0;
          top: 48px;
          width: 310px;
          padding: 12px;
          z-index: 250;
          border-radius: var(--radius-md);
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-md);
          animation: fadeIn 0.2s ease;
        }
        .theme-dropdown-header {
          padding: 4px 8px 10px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 8px;
        }
        .theme-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-heading);
        }
        .theme-header-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
          display: block;
        }
        .theme-options-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .theme-option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 9px 10px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: var(--transition-smooth);
          text-align: left;
        }
        .theme-option-row:hover {
          background: var(--bg-secondary);
        }
        .theme-option-row.selected {
          background: var(--accent-sage-soft);
          border-color: var(--accent-sage);
        }
        .theme-row-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .theme-item-icon {
          font-size: 1.25rem;
        }
        .theme-item-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-heading);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .theme-badge-pill {
          font-size: 0.65rem;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          background: var(--border-subtle);
          color: var(--text-muted);
          font-weight: 500;
        }
        .theme-item-tagline {
          font-size: 0.73rem;
          color: var(--text-muted);
        }
        .theme-row-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .theme-swatch-dots {
          display: flex;
          gap: 4px;
        }
        .swatch-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .theme-check-icon {
          color: var(--accent-sage);
        }

        /* Daily Streak Pill */
        .streak-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(186, 78, 50, 0.1);
          border: 1px solid rgba(186, 78, 50, 0.25);
          border-radius: var(--radius-full);
          color: var(--accent-coral);
          font-size: 0.85rem;
          font-weight: 600;
        }
        .streak-flame-icon {
          color: var(--accent-coral);
          animation: pulseGlow 2s infinite ease-in-out;
        }
        .user-profile-relative {
          position: relative;
        }
        .user-avatar-btn {
          background: transparent;
          padding: 0;
          border-radius: 50%;
          border: 2px solid var(--accent-sage);
          overflow: hidden;
          transition: var(--transition-smooth);
        }
        .user-avatar-btn:hover {
          transform: scale(1.05);
        }
        .user-avatar-img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .user-avatar-fallback {
          width: 38px;
          height: 38px;
          background: var(--accent-sage);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        .user-dropdown-menu {
          position: absolute;
          right: 0;
          top: 48px;
          width: 240px;
          padding: 12px;
          z-index: 200;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-md);
        }
        .user-dropdown-header {
          padding: 4px 8px;
        }
        .dropdown-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-heading);
        }
        .dropdown-email {
          font-size: 0.78rem;
          color: var(--text-muted);
          word-break: break-all;
        }
        .admin-chip {
          display: inline-block;
          font-size: 0.7rem;
          background: var(--accent-sage-soft);
          color: var(--accent-sage);
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 6px;
          font-weight: 600;
        }
        .dropdown-divider {
          border: none;
          border-top: 1px solid var(--border-subtle);
          margin: 10px 0;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 10px;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          font-size: 0.88rem;
          text-align: left;
          transition: var(--transition-smooth);
        }
        .dropdown-item:hover {
          background: var(--bg-secondary);
          color: var(--text-heading);
        }
        .dropdown-item.logout:hover {
          color: #E11D48;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .auth-modal {
          width: 100%;
          max-width: 440px;
          padding: 32px;
          text-align: center;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-md);
        }
        .modal-icon-circle {
          width: 56px;
          height: 56px;
          margin: 0 auto 16px;
          background: var(--accent-sage-soft);
          border: 1px solid var(--border-focus);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-sage);
        }
        .modal-title {
          font-size: 1.6rem;
          margin-bottom: 8px;
          color: var(--text-heading);
        }
        .modal-subtitle {
          font-size: 0.9rem;
          margin-bottom: 24px;
          color: var(--text-secondary);
        }
        .google-sign-in-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #FFFFFF;
          color: #1F2937;
          font-weight: 500;
          font-size: 0.95rem;
          padding: 12px 20px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(0,0,0,0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: var(--transition-smooth);
        }
        .google-sign-in-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }
        .auth-divider {
          position: relative;
          margin: 22px 0;
          text-align: center;
        }
        .auth-divider::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1px;
          background: var(--border-subtle);
        }
        .auth-divider span {
          position: relative;
          background: var(--bg-card);
          padding: 0 12px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .demo-login-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .demo-btn {
          width: 100%;
          justify-content: center;
          padding: 11px;
        }
        .auth-modal-footer {
          margin-top: 18px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .navbar-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 0;
            justify-content: space-around;
            padding: 10px 6px;
            background: var(--nav-bg);
            border-top: 1px solid var(--border-subtle);
            border-bottom: none;
          }
          .nav-tab span {
            display: none;
          }
          .theme-btn-label {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
