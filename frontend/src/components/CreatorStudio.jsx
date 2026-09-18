import React, { useState, useEffect } from "react";
import { 
  UploadCloud, 
  Video, 
  Headphones, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Link as LinkIcon,
  Image as ImageIcon,
  Clock,
  User,
  Tag as TagIcon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export function CreatorStudio({ onContentPublished }) {
  const { user, isAdmin } = useAuth();

  const [contentType, setContentType] = useState("video_meditation"); // video_meditation, audio_meditation, blog_post
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  const [teachers, setTeachers] = useState([]);
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(null);

  useEffect(() => {
    loadMeta();
  }, []);

  const loadMeta = async () => {
    try {
      const [tList, tagList] = await Promise.all([
        api.getTeachers(),
        api.getTags()
      ]);
      setTeachers(tList);
      setTags(tagList);
      if (tList.length > 0) setSelectedTeacherId(tList[0].id);
    } catch (e) {
      console.error("Error loading teachers/tags:", e);
    }
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    // Auto-generate URL slug
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);
  };

  const toggleTag = (id) => {
    if (selectedTagIds.includes(id)) {
      setSelectedTagIds(selectedTagIds.filter((t) => t !== id));
    } else {
      setSelectedTagIds([...selectedTagIds, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please provide a title");

    setIsSubmitting(true);
    setPublishedSuccess(null);

    try {
      const payload = {
        type: contentType,
        title: title.trim(),
        slug: slug.trim() || `post-${Date.now()}`,
        summary: summary.trim(),
        body_markdown: bodyMarkdown.trim(),
        media_url: mediaUrl.trim() || undefined,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        duration_seconds: contentType === "blog_post" ? 0 : durationMinutes * 60,
        teacher_id: selectedTeacherId || undefined,
        tag_ids: selectedTagIds,
        is_published: true
      };

      const result = await api.createContent(payload);
      setPublishedSuccess(result);

      // Reset form
      setTitle("");
      setSlug("");
      setSummary("");
      setBodyMarkdown("");
      setMediaUrl("");
      setThumbnailUrl("");
      if (onContentPublished) onContentPublished();
    } catch (err) {
      console.error("Publishing error:", err);
      alert("Publishing failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Studio mode: "manual" | "youtube_sync" | "manage"
  const [studioTab, setStudioTab] = useState("manual");
  
  // YouTube Sync state
  const [ytUrl, setYtUrl] = useState("");
  const [ytFeedUrl, setYtFeedUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleYtSingleSync = async (e) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const item = await api.syncYouTubeSingle({
        video_url: ytUrl.trim(),
        teacher_id: selectedTeacherId || undefined,
        tag_ids: selectedTagIds
      });
      setSyncStatus(`Successfully imported "${item.title}" from YouTube!`);
      setYtUrl("");
      if (onContentPublished) onContentPublished();
    } catch (err) {
      alert("YouTube sync failed: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleYtFeedSync = async (e) => {
    e.preventDefault();
    if (!ytFeedUrl.trim()) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await api.syncYouTubeFeed({
        channel_or_playlist: ytFeedUrl.trim(),
        teacher_id: selectedTeacherId || undefined,
        tag_ids: selectedTagIds
      });
      setSyncStatus(res.message);
      setYtFeedUrl("");
      if (onContentPublished) onContentPublished();
    } catch (err) {
      alert("Feed sync failed: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear all sample content? This allows you to replace everything with your own real content.")) {
      try {
        await api.clearAllContent();
        alert("All sample content cleared! Your library is now fresh.");
        if (onContentPublished) onContentPublished();
      } catch (e) {
        alert("Failed to clear content: " + e.message);
      }
    }
  };

  return (
    <div className="creator-studio-wrapper">
      {/* Studio Header */}
      <div className="studio-intro glass-card">
        <div className="intro-icon-circle">
          <UploadCloud size={28} />
        </div>
        <div>
          <h1 className="serif-heading intro-title">Creator Publishing Studio</h1>
          <p className="intro-desc">
            Upload, sync from YouTube, and manage your guided meditation videos, audio practices, and mindfulness blog reflections.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="studio-subnav glass-card">
        <button 
          className={`subnav-btn ${studioTab === "manual" ? "active" : ""}`}
          onClick={() => setStudioTab("manual")}
        >
          <UploadCloud size={16} />
          <span>Manual Publishing</span>
        </button>
        <button 
          className={`subnav-btn ${studioTab === "youtube_sync" ? "active" : ""}`}
          onClick={() => setStudioTab("youtube_sync")}
        >
          <Video size={16} />
          <span>YouTube Auto-Sync</span>
        </button>
        <button 
          className={`subnav-btn ${studioTab === "manage" ? "active" : ""}`}
          onClick={() => setStudioTab("manage")}
        >
          <Sparkles size={16} />
          <span>Manage / Replace Content</span>
        </button>
      </div>

      {/* Hosting Recommendation Alert Box */}
      <div className="hosting-tip-box glass-card">
        <div className="tip-header">
          <Info size={18} className="tip-icon" />
          <h4>Recommended Video & Audio Hosting Strategy</h4>
        </div>
        <p className="tip-text">
          • <strong>Videos</strong>: For 100% free streaming with zero buffering, upload your video to <strong>YouTube (set as Unlisted)</strong> and paste the link here. For commercial privacy, use <strong>Bunny.net Stream</strong> ($1/mo, auto HLS multi-bitrate).<br/>
          • <strong>Audio</strong>: Store MP3/AAC files in <strong>AWS S3 + CloudFront</strong> (or Cloudflare R2 for zero bandwidth egress costs).<br/>

          • <strong>Blog Posts</strong>: Stored directly in your app's PostgreSQL database with full rich Markdown styling.
        </p>
      </div>

      {publishedSuccess && (
        <div className="publish-success-banner glass-card">
          <CheckCircle2 size={24} className="success-icon" />
          <div>
            <h4>Published Successfully!</h4>
            <p>"{publishedSuccess.title}" is now live in the Explore catalog for all members.</p>
          </div>
        </div>
      )}

      {/* Tab 1: Manual Publishing Form */}
      {studioTab === "manual" && (
        <form onSubmit={handleSubmit} className="creator-form glass-card">
          <div className="form-section-title">
            <Sparkles size={18} />
            <span>1. Select Content Type</span>
          </div>

          <div className="content-type-selector">
            <button
              type="button"
              className={`type-option ${contentType === "video_meditation" ? "active" : ""}`}
              onClick={() => setContentType("video_meditation")}
            >
              <Video size={20} />
              <div>
                <div className="option-name">Guided Video</div>
                <div className="option-desc">Video meditation or visual posture walk-through</div>
              </div>
            </button>

            <button
              type="button"
              className={`type-option ${contentType === "audio_meditation" ? "active" : ""}`}
              onClick={() => setContentType("audio_meditation")}
            >
              <Headphones size={20} />
              <div>
                <div className="option-name">Guided Audio</div>
                <div className="option-desc">Voice guidance, body scans & ambient tracks</div>
              </div>
            </button>

            <button
              type="button"
              className={`type-option ${contentType === "blog_post" ? "active" : ""}`}
              onClick={() => setContentType("blog_post")}
            >
              <BookOpen size={20} />
              <div>
                <div className="option-name">Mindful Blog</div>
                <div className="option-desc">Reflections, neuroscience & practical tips</div>
              </div>
            </button>
          </div>

          <div className="form-section-title" style={{ marginTop: "24px" }}>
            <TagIcon size={18} />
            <span>2. Content Details & Metadata</span>
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label>Title</label>
              <input
                type="text"
                placeholder="e.g. Living in Presence: Resting the Heart"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="studio-input"
                required
              />
            </div>

            <div className="form-group flex-1">
              <label>URL Slug</label>
              <input
                type="text"
                placeholder="living-in-presence"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="studio-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Teacher / Author</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="studio-input"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {contentType !== "blog_post" && (
              <div className="form-group flex-1">
                <label>Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 10)}
                  className="studio-input"
                />
              </div>
            )}
          </div>

          {/* Media URLs */}
          {contentType !== "blog_post" && (
            <div className="form-group">
              <label>
                <LinkIcon size={14} />
                <span>{contentType === "video_meditation" ? "Video Stream / YouTube Embed URL" : "Audio MP3 / Stream URL"}</span>
              </label>
              <input
                type="url"
                placeholder={contentType === "video_meditation" ? "https://commondatastorage.googleapis.com/... or https://youtube.com/embed/..." : "https://actions.google.com/sounds/v1/..."}
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="studio-input"
              />
            </div>
          )}

          <div className="form-group">
            <label>
              <ImageIcon size={14} />
              <span>Cover Image Thumbnail URL</span>
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="studio-input"
            />
          </div>

          {/* Topic Tag Checkboxes */}
          <div className="form-group">
            <label>Topics & Categories</label>
            <div className="tags-select-cloud">
              {tags.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`tag-badge ${selectedTagIds.includes(t.id) ? "active" : ""}`}
                  onClick={() => toggleTag(t.id)}
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Short Summary</label>
            <textarea
              placeholder="Brief 1-2 sentence overview shown in the explore cards..."
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="studio-input"
            />
          </div>

          <div className="form-group">
            <label>{contentType === "blog_post" ? "Full Blog Article (Markdown)" : "Practice Reflection Notes & Transcript (Markdown)"}</label>
            <textarea
              placeholder="Write your article or reflection in Markdown (supports # headings, *italics*, **bold**, > quotes)..."
              rows={8}
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              className="studio-input markdown-editor"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary publish-submit-btn"
              disabled={isSubmitting}
            >
              <Sparkles size={18} />
              <span>{isSubmitting ? "Publishing to Sanctuary..." : "Publish Content"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: YouTube Auto-Sync */}
      {studioTab === "youtube_sync" && (
        <div className="youtube-sync-section glass-card">
          <div className="sync-block">
            <div className="block-title">
              <Video size={20} className="icon-sage" />
              <h3 className="serif-heading">Import Single YouTube Meditation Video</h3>
            </div>
            <p className="block-desc">
              Paste any public or unlisted YouTube video URL. The title, thumbnail, and video stream will be automatically extracted and added to your practice library.
            </p>
            <form onSubmit={handleYtSingleSync} className="sync-form-row">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                className="studio-input flex-2"
                required
              />
              <button type="submit" className="btn-primary" disabled={isSyncing}>
                <Sparkles size={16} />
                <span>{isSyncing ? "Importing..." : "Import Video"}</span>
              </button>
            </form>
          </div>

          <hr className="sync-divider" />

          <div className="sync-block">
            <div className="block-title">
              <UploadCloud size={20} className="icon-gold" />
              <h3 className="serif-heading">Sync Full YouTube Channel or Playlist</h3>
            </div>
            <p className="block-desc">
              Paste your YouTube Channel ID or Playlist URL (e.g. <code>https://www.youtube.com/playlist?list=PL...</code>). All videos will be imported into your meditation catalog with zero API key needed.
            </p>
            <form onSubmit={handleYtFeedSync} className="sync-form-row">
              <input
                type="text"
                placeholder="https://www.youtube.com/playlist?list=PL... or Channel ID"
                value={ytFeedUrl}
                onChange={(e) => setYtFeedUrl(e.target.value)}
                className="studio-input flex-2"
                required
              />
              <button type="submit" className="btn-secondary" disabled={isSyncing}>
                <Video size={16} />
                <span>{isSyncing ? "Syncing Feed..." : "Sync Playlist / Channel"}</span>
              </button>
            </form>
          </div>

          {syncStatus && (
            <div className="sync-status-box">
              <CheckCircle2 size={18} />
              <span>{syncStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Manage / Clear Content */}
      {studioTab === "manage" && (
        <div className="manage-content-section glass-card">
          <div className="manage-header">
            <h3 className="serif-heading">Manage Sanctuary Content</h3>
            <p>
              Currently, your database is initialized with mindful starter content from Tara Brach & Mindful.org.
              When you are ready to use only your own videos, audios, and blog posts, you can clear the sample data below.
            </p>
          </div>

          <div className="danger-zone-box">
            <div className="danger-text">
              <h4>Wipe Sample Starter Content</h4>
              <p>Clears all sample meditations and articles so you can publish your own custom library from a blank canvas.</p>
            </div>
            <button type="button" className="btn-secondary danger-btn" onClick={handleClearAll}>
              Clear Sample Content
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .creator-studio-wrapper {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .studio-intro {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 28px;
        }
        .intro-icon-circle {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          background: var(--accent-sage-soft);
          color: var(--accent-sage);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .intro-title {
          font-size: 1.8rem;
          margin-bottom: 4px;
        }
        .studio-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }
        .studio-subnav {
          display: flex;
          gap: 10px;
          padding: 6px;
          border-radius: var(--radius-full);
          align-self: center;
        }
        .subnav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: var(--radius-full);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-weight: 500;
          transition: var(--transition-smooth);
        }
        .subnav-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .subnav-btn.active {
          background: var(--accent-sage-soft);
          color: #A3E2BD;
          border: 1px solid rgba(91, 179, 129, 0.35);
        }
        .youtube-sync-section, .manage-content-section {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sync-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .block-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .block-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .sync-form-row {
          display: flex;
          gap: 12px;
          margin-top: 6px;
        }
        .sync-divider {
          border: none;
          border-top: 1px solid var(--border-subtle);
        }
        .sync-status-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: rgba(91, 179, 129, 0.15);
          border: 1px solid rgba(91, 179, 129, 0.35);
          color: #A3E2BD;
          border-radius: var(--radius-sm);
        }
        .danger-zone-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: var(--radius-sm);
          gap: 16px;
          flex-wrap: wrap;
        }
        .danger-text h4 {
          color: #F87171;
          margin-bottom: 4px;
        }
        .danger-text p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .danger-btn {
          border-color: rgba(239, 68, 68, 0.4);
          color: #FCA5A5;
        }
        .danger-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        .hosting-tip-box {
          padding: 20px 24px;
          background: rgba(232, 193, 112, 0.08);
          border-color: rgba(232, 193, 112, 0.25);
        }
        .tip-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent-gold);
          margin-bottom: 8px;
        }
        .tip-text {
          font-size: 0.88rem;
          line-height: 1.7;
          color: #E2E8F0;
        }
        .publish-success-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 24px;
          background: rgba(91, 179, 129, 0.15);
          border-color: rgba(91, 179, 129, 0.4);
          color: #A3E2BD;
        }
        .success-icon {
          color: var(--accent-sage);
          flex-shrink: 0;
        }
        .creator-form {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .form-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 1.05rem;
          color: var(--text-heading);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .content-type-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .type-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          text-align: left;
          transition: var(--transition-smooth);
        }
        .type-option:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-focus);
        }
        .type-option.active {
          background: var(--accent-sage-soft);
          border-color: var(--accent-sage);
          color: var(--accent-sage);
        }
        .option-name {
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 2px;
        }
        .option-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .form-row {
          display: flex;
          gap: 16px;
        }
        .flex-1 { flex: 1; }
        .flex-2 { flex: 2; }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .studio-input {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          color: var(--text-primary);
          font-family: var(--font-ui);
          font-size: 0.92rem;
          outline: none;
          transition: var(--transition-smooth);
        }
        .studio-input:focus {
          border-color: var(--border-focus);
        }
        .studio-input option {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .markdown-editor {
          font-family: monospace;
          line-height: 1.5;
        }
        .tags-select-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .form-actions {
          margin-top: 10px;
          display: flex;
          justify-content: flex-end;
        }
        .publish-submit-btn {
          padding: 14px 32px;
          font-size: 1rem;
        }

        @media (max-width: 680px) {
          .content-type-selector {
            grid-template-columns: 1fr;
          }
          .form-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
