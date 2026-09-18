import React from "react";
import { ArrowLeft, Clock, User, Calendar, BookOpen, Share2, Sparkles } from "lucide-react";

export function BlogPostView({ post, onBack, onStartRelatedPractice }) {
  const estimateReadingTime = (text) => {
    if (!text) return "3 min read";
    const words = text.trim().split(/\s+/).length;
    return `${Math.ceil(words / 200)} min read`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Today";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="blog-article-view">
      <button className="btn-ghost back-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Back to Teachings</span>
      </button>

      <article className="article-card glass-card">
        {post.thumbnail_url && (
          <div className="article-hero-cover">
            <img src={post.thumbnail_url} alt={post.title} className="cover-img" />
          </div>
        )}

        <div className="article-header">
          <div className="article-tags">
            {post.tags?.map((t) => (
              <span key={t.id} className="tag-badge">
                #{t.name}
              </span>
            ))}
          </div>

          <h1 className="serif-heading article-headline">{post.title}</h1>

          <div className="article-meta-row">
            {post.teacher && (
              <div className="author-info">
                {post.teacher.avatar_url && (
                  <img src={post.teacher.avatar_url} alt={post.teacher.name} className="author-avatar" />
                )}
                <span>By <strong>{post.teacher.name}</strong></span>
              </div>
            )}
            <span className="dot">•</span>
            <div className="meta-item">
              <Clock size={14} />
              <span>{estimateReadingTime(post.body_markdown)}</span>
            </div>
            <span className="dot">•</span>
            <div className="meta-item">
              <Calendar size={14} />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </div>

        {post.summary && (
          <div className="article-lead-summary">
            <p>{post.summary}</p>
          </div>
        )}

        <div className="article-body-content">
          <div dangerouslySetInnerHTML={{
            __html: (post.body_markdown || "")
              .replace(/### (.*)/g, '<h3 class="serif-heading article-subheading">$1</h3>')
              .replace(/## (.*)/g, '<h2 class="serif-heading article-sectionheading">$1</h2>')
              .replace(/> (.*)/g, '<blockquote class="article-quote">$1</blockquote>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/\n\n/g, '<p class="article-paragraph">')
              .replace(/\n- (.*)/g, '<li>$1</li>')
          }} />
        </div>

        {/* Action footer: Start related meditation */}
        <div className="article-callout-footer">
          <div className="callout-text">
            <Sparkles size={22} className="sparkle-icon" />
            <div>
              <h4>Integrate This Reflection</h4>
              <p>Take 5 quiet minutes right now to rest in presence and digest these insights.</p>
            </div>
          </div>
          <button className="btn-primary" onClick={onStartRelatedPractice}>
            Start 5-min Sit
          </button>
        </div>
      </article>

      <style>{`
        .blog-article-view {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .article-card {
          overflow: hidden;
          padding: 0 0 36px 0;
        }
        .article-hero-cover {
          width: 100%;
          height: 340px;
          overflow: hidden;
        }
        .cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .article-header {
          padding: 32px 36px 12px;
        }
        .article-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .article-headline {
          font-size: 2.3rem;
          line-height: 1.25;
          margin-bottom: 18px;
        }
        .article-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 0.85rem;
          flex-wrap: wrap;
        }
        .author-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }
        .author-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .dot {
          color: var(--border-subtle);
        }
        .article-lead-summary {
          margin: 0 36px 24px;
          padding: 16px 20px;
          background: rgba(91, 179, 129, 0.08);
          border-left: 3px solid var(--accent-sage);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
          font-size: 1.05rem;
          color: #D1E7DD;
          font-style: italic;
        }
        .article-body-content {
          padding: 0 36px;
          color: var(--text-secondary);
          font-size: 1.05rem;
          line-height: 1.85;
        }
        .article-sectionheading {
          font-size: 1.6rem;
          margin: 28px 0 12px;
          color: var(--text-heading);
        }
        .article-subheading {
          font-size: 1.3rem;
          margin: 24px 0 10px;
          color: var(--accent-gold);
        }
        .article-quote {
          margin: 20px 0;
          padding: 14px 24px;
          border-left: 3px solid var(--accent-gold);
          background: rgba(168, 110, 18, 0.08);
          font-family: var(--font-serif);
          font-size: 1.2rem;
          font-style: italic;
          color: var(--text-heading);
        }
        .article-paragraph {
          margin-bottom: 18px;
        }
        .article-callout-footer {
          margin: 36px 36px 0;
          padding: 24px;
          background: linear-gradient(135deg, var(--accent-sage-soft) 0%, var(--bg-card) 100%);
          border: 1px solid var(--border-focus);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .callout-text {
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 480px;
        }
        .sparkle-icon {
          color: var(--accent-gold);
          flex-shrink: 0;
        }
        .callout-text h4 {
          font-size: 1.05rem;
          color: var(--text-heading);
          margin-bottom: 4px;
        }
        .callout-text p {
          font-size: 0.88rem;
        }

        @media (max-width: 650px) {
          .article-header, .article-body-content, .article-lead-summary, .article-callout-footer {
            padding-left: 20px;
            padding-right: 20px;
            margin-left: 0;
            margin-right: 0;
          }
          .article-headline {
            font-size: 1.75rem;
          }
          .article-hero-cover {
            height: 220px;
          }
        }
      `}</style>
    </div>
  );
}
