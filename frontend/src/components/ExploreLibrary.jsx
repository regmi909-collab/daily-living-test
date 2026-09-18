import React, { useState, useEffect } from "react";
import { 
  Search, 
  Headphones, 
  Video, 
  BookOpen, 
  Clock, 
  Sparkles, 
  Filter,
  Play
} from "lucide-react";
import { api } from "../services/api";

export function ExploreLibrary({ onSelectPractice, onSelectBlog }) {
  const [contentList, setContentList] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedType, setSelectedType] = useState("all"); // all, audio_meditation, video_meditation, blog_post
  const [selectedTag, setSelectedTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedType, selectedTag, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedType !== "all") params.type = selectedType;
      if (selectedTag) params.tag = selectedTag;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [items, tagList] = await Promise.all([
        api.getContent(params),
        api.getTags()
      ]);
      setContentList(items);
      setTags(tagList);
    } catch (err) {
      console.error("Failed to load content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (item.type === "blog_post") {
      onSelectBlog(item);
    } else {
      onSelectPractice(item);
    }
  };

  return (
    <div className="explore-container">
      {/* Header */}
      <div className="explore-hero">
        <h1 className="serif-heading explore-title">Mindful Practices & Teachings</h1>
        <p className="explore-subtitle">
          Guided journeys, body scans, and wisdom teachings inspired by Tara Brach, Jon Kabat-Zinn, and Mindful.org
        </p>

        {/* Search Input */}
        <div className="search-bar-wrapper glass-card">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search practices, e.g. 'anxiety', 'sleep', 'breath', 'RAIN'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="btn-ghost clear-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="filter-controls-row">
        <div className="type-pills">
          <button
            className={`type-pill ${selectedType === "all" ? "active" : ""}`}
            onClick={() => setSelectedType("all")}
          >
            All Practices
          </button>
          <button
            className={`type-pill ${selectedType === "audio_meditation" ? "active" : ""}`}
            onClick={() => setSelectedType("audio_meditation")}
          >
            <Headphones size={15} />
            <span>Audio Guided</span>
          </button>
          <button
            className={`type-pill ${selectedType === "video_meditation" ? "active" : ""}`}
            onClick={() => setSelectedType("video_meditation")}
          >
            <Video size={15} />
            <span>Video Meditations</span>
          </button>
          <button
            className={`type-pill ${selectedType === "blog_post" ? "active" : ""}`}
            onClick={() => setSelectedType("blog_post")}
          >
            <BookOpen size={15} />
            <span>Articles & Blogs</span>
          </button>
        </div>

        {/* Topic Tags */}
        <div className="tags-scroll-row">
          <button
            className={`tag-badge ${selectedTag === "" ? "active" : ""}`}
            onClick={() => setSelectedTag("")}
          >
            All Topics
          </button>
          {tags.map((t) => (
            <button
              key={t.id}
              className={`tag-badge ${selectedTag === t.slug ? "active" : ""}`}
              onClick={() => setSelectedTag(selectedTag === t.slug ? "" : t.slug)}
            >
              #{t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading sanctuary teachings...</p>
        </div>
      ) : contentList.length === 0 ? (
        <div className="empty-state glass-card">
          <Sparkles size={36} className="empty-icon" />
          <h3>No teachings found</h3>
          <p>Try searching for a different keyword or clearing your topic filter.</p>
          <button className="btn-secondary" onClick={() => { setSelectedTag(""); setSearchQuery(""); setSelectedType("all"); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {contentList.map((item) => {
            const isBlog = item.type === "blog_post";
            const isVideo = item.type === "video_meditation";

            return (
              <div 
                key={item.id} 
                className="content-card glass-card"
                onClick={() => handleItemClick(item)}
              >
                {item.thumbnail_url && (
                  <div className="card-thumb-wrapper">
                    <img src={item.thumbnail_url} alt={item.title} className="card-img" />
                    <div className="card-type-overlay">
                      {isBlog ? (
                        <span className="type-chip blog"><BookOpen size={12} /> Read</span>
                      ) : isVideo ? (
                        <span className="type-chip video"><Video size={12} /> Video</span>
                      ) : (
                        <span className="type-chip audio"><Headphones size={12} /> Audio</span>
                      )}
                    </div>
                    {!isBlog && (
                      <div className="card-play-hover">
                        <Play size={20} fill="currentColor" />
                      </div>
                    )}
                  </div>
                )}

                <div className="card-body">
                  <div className="card-meta">
                    {item.duration_seconds > 0 ? (
                      <span className="duration-text">
                        <Clock size={13} />
                        <span>{Math.round(item.duration_seconds / 60)} min</span>
                      </span>
                    ) : (
                      <span className="duration-text">
                        <Clock size={13} />
                        <span>3 min read</span>
                      </span>
                    )}
                    {item.teacher && (
                      <span className="teacher-text">• {item.teacher.name}</span>
                    )}
                  </div>

                  <h3 className="serif-heading card-title">{item.title}</h3>
                  <p className="card-summary">{item.summary}</p>

                  <div className="card-footer-tags">
                    {item.tags?.slice(0, 2).map((t) => (
                      <span key={t.id} className="tag-chip-sm">
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded CSS */}
      <style>{`
        .explore-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .explore-hero {
          text-align: center;
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .explore-title {
          font-size: 2.4rem;
        }
        .explore-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
        }
        .search-bar-wrapper {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          margin-top: 8px;
        }
        .search-icon {
          color: var(--text-muted);
        }
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-ui);
          font-size: 0.95rem;
        }
        .search-input::placeholder {
          color: var(--text-muted);
        }
        .clear-btn {
          padding: 4px;
          color: var(--text-muted);
        }
        .filter-controls-row {
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
        }
        .type-pills {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .type-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          font-size: 0.88rem;
          font-weight: 500;
          transition: var(--transition-smooth);
        }
        .type-pill:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }
        .type-pill.active {
          background: var(--accent-sage-soft);
          color: #A3E2BD;
          border-color: var(--accent-sage);
        }
        .tags-scroll-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .content-card {
          cursor: pointer;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .content-card:hover {
          transform: translateY(-4px);
        }
        .card-thumb-wrapper {
          position: relative;
          width: 100%;
          height: 180px;
          overflow: hidden;
        }
        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .content-card:hover .card-img {
          transform: scale(1.04);
        }
        .card-type-overlay {
          position: absolute;
          top: 12px;
          left: 12px;
        }
        .type-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          backdrop-filter: blur(8px);
        }
        .type-chip.audio {
          background: rgba(91, 179, 129, 0.85);
          color: #FFFFFF;
        }
        .type-chip.video {
          background: rgba(232, 193, 112, 0.9);
          color: #1A1A1A;
        }
        .type-chip.blog {
          background: rgba(112, 169, 161, 0.85);
          color: #FFFFFF;
        }
        .card-play-hover {
          position: absolute;
          right: 14px;
          bottom: 14px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(91, 179, 129, 0.9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.8);
          transition: var(--transition-smooth);
        }
        .content-card:hover .card-play-hover {
          opacity: 1;
          transform: scale(1);
        }
        .card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .duration-text {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--accent-sage);
        }
        .card-title {
          font-size: 1.35rem;
          line-height: 1.3;
          margin-bottom: 8px;
          color: var(--text-heading);
        }
        .card-summary {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-footer-tags {
          margin-top: auto;
          display: flex;
          gap: 6px;
        }
        .tag-chip-sm {
          font-size: 0.72rem;
          color: var(--text-muted);
          background: var(--bg-glass);
          border: 1px solid var(--border-subtle);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }
        .loading-state, .empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .loading-spinner {
          width: 38px;
          height: 38px;
          border: 3px solid rgba(91, 179, 129, 0.2);
          border-top-color: var(--accent-sage);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }
        .empty-icon {
          color: var(--accent-gold);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
