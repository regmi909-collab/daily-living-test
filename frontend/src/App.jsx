import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { TimerTracker } from "./components/TimerTracker";
import { ExploreLibrary } from "./components/ExploreLibrary";
import { AudioGuidedPlayer } from "./components/AudioGuidedPlayer";
import { VideoGuidedPlayer } from "./components/VideoGuidedPlayer";
import { BlogPostView } from "./components/BlogPostView";
import { GuruChatbot } from "./components/GuruChatbot";
import { CreatorStudio } from "./components/CreatorStudio";
import { api } from "./services/api";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, timer, explore, chat, creator
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(5);

  const refreshStats = async () => {
    try {
      const stats = await api.getDashboardStats();
      if (stats && stats.current_streak_days !== undefined) {
        setCurrentStreak(stats.current_streak_days);
      }
    } catch (e) {
      // Keep existing streak
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  const handleSelectPractice = (practice) => {
    setSelectedPractice(practice);
    setSelectedBlog(null);
  };

  const handleSelectBlog = (blog) => {
    setSelectedBlog(blog);
    setSelectedPractice(null);
  };

  const handleBackToExplore = () => {
    setSelectedPractice(null);
    setSelectedBlog(null);
    setActiveTab("explore");
  };

  const handleSessionLogged = () => {
    refreshStats();
  };

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setSelectedPractice(null);
          setSelectedBlog(null);
          setActiveTab(tab);
        }}
        currentStreak={currentStreak}
      />

      <main className="main-content">
        {/* If a guided meditation is currently open */}
        {selectedPractice ? (
          selectedPractice.type === "video_meditation" ? (
            <VideoGuidedPlayer
              practice={selectedPractice}
              onBack={handleBackToExplore}
              onSessionCompleted={handleSessionLogged}
            />
          ) : (
            <AudioGuidedPlayer
              practice={selectedPractice}
              onBack={handleBackToExplore}
              onSessionCompleted={handleSessionLogged}
            />
          )
        ) : selectedBlog ? (
          /* If a blog post is currently open */
          <BlogPostView
            post={selectedBlog}
            onBack={handleBackToExplore}
            onStartRelatedPractice={() => {
              setSelectedBlog(null);
              setActiveTab("timer");
            }}
          />
        ) : (
          /* Normal Tab Content */
          <>
            {activeTab === "dashboard" && (
              <Dashboard
                onStartMeditation={() => setActiveTab("timer")}
                onExplorePractices={() => setActiveTab("explore")}
              />
            )}

            {activeTab === "timer" && (
              <TimerTracker
                onSessionLogged={handleSessionLogged}
                onSelectAudioGuided={() => setActiveTab("explore")}
                onSelectVideoGuided={() => setActiveTab("explore")}
              />
            )}

            {activeTab === "explore" && (
              <ExploreLibrary
                onSelectPractice={handleSelectPractice}
                onSelectBlog={handleSelectBlog}
              />
            )}

            {activeTab === "chat" && (
              <GuruChatbot
                onSelectPractice={(practice) => {
                  setSelectedPractice(practice);
                }}
              />
            )}

            {activeTab === "creator" && (
              <CreatorStudio
                onContentPublished={() => {
                  refreshStats();
                  setActiveTab("explore");
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}


