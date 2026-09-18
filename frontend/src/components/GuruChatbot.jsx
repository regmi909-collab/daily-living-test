import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Play, 
  Clock, 
  HelpCircle,
  Flame,
  Wind
} from "lucide-react";
import { api } from "../services/api";

const SUGGESTED_QUESTIONS = [
  "I feel overwhelmed with work stress right now",
  "Can you guide me through Tara Brach's R.A.I.N. practice?",
  "I cannot fall asleep because my mind is racing",
  "How can I stay mindful throughout busy days?"
];

export function GuruChatbot({ onSelectPractice }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "model",
      message: "Peace be with you. I am Bodhi, your mindful companion. What is moving through your heart or mind in this moment? Tell me how you are feeling, or ask for guidance on your practice."
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      }
    } catch (e) {
      console.warn("Could not load previous chat history:", e);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || inputMessage;
    if (!msg.trim() || isSending) return;

    setInputMessage("");
    const tempUserMsg = {
      id: Date.now().toString(),
      role: "user",
      message: msg.trim()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const response = await api.sendChatMessage(msg.trim());
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          message: "Take a gentle pause and breathe. I am always here with you. Please try asking again in a quiet moment."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="guru-chat-container">
      {/* Header */}
      <div className="guru-chat-header glass-card">
        <div className="guru-avatar-circle">
          <Bot size={24} />
        </div>
        <div className="guru-header-info">
          <h2 className="serif-heading guru-name">Bodhi — Mindful Guru</h2>
          <p className="guru-status">
            <span className="status-dot" /> Powered by Gemini AI • Always present
          </p>
        </div>
      </div>

      {/* Message Stream */}
      <div className="messages-stream">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={`message-row ${isUser ? "user-row" : "bot-row"}`}>
              {!isUser && (
                <div className="avatar-chip bot">
                  <Bot size={15} />
                </div>
              )}

              <div className={`message-bubble glass-card ${isUser ? "user-bubble" : "bot-bubble"}`}>
                <div className="message-text">
                  {m.message.split("\n\n").map((para, idx) => (
                    <p key={idx} className="bubble-paragraph">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Recommended Practice Action Card */}
                {m.recommended_content && (
                  <div 
                    className="recommended-card"
                    onClick={() => onSelectPractice?.(m.recommended_content)}
                  >
                    <div className="rec-badge">Recommended Practice</div>
                    <div className="rec-title">{m.recommended_content.title}</div>
                    <div className="rec-action">
                      <Play size={14} fill="currentColor" />
                      <span>Start Session ({Math.round(m.recommended_content.duration_seconds / 60)} min)</span>
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="avatar-chip user">
                  <User size={15} />
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="message-row bot-row">
            <div className="avatar-chip bot">
              <Bot size={15} />
            </div>
            <div className="message-bubble glass-card bot-bubble typing-bubble">
              <span className="dot-pulse" />
              <span className="dot-pulse" />
              <span className="dot-pulse" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts if only 1 message */}
      {messages.length <= 1 && (
        <div className="suggested-prompts">
          <div className="prompts-label">Need guidance? Try asking:</div>
          <div className="prompts-grid">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                className="suggested-btn"
                onClick={() => handleSendMessage(q)}
              >
                <span>"{q}"</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <form
        className="chat-input-bar glass-card"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          type="text"
          placeholder="Share what is on your mind, or ask for mindful guidance..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="chat-input"
        />
        <button
          type="submit"
          className="btn-primary send-btn"
          disabled={!inputMessage.trim() || isSending}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Styles */}
      <style>{`
        .guru-chat-container {
          max-width: 760px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 180px);
          min-height: 520px;
          gap: 16px;
        }
        .guru-chat-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
        }
        .guru-avatar-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent-sage-soft);
          border: 1px solid rgba(91, 179, 129, 0.4);
          color: var(--accent-sage);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .guru-name {
          font-size: 1.35rem;
          color: var(--text-heading);
        }
        .guru-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent-sage);
        }
        .messages-stream {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 8px 4px;
        }
        .message-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          max-width: 82%;
        }
        .user-row {
          align-self: flex-end;
          flex-direction: row;
        }
        .bot-row {
          align-self: flex-start;
        }
        .avatar-chip {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .avatar-chip.bot {
          background: var(--accent-sage-soft);
          color: var(--accent-sage);
        }
        .avatar-chip.user {
          background: rgba(168, 110, 18, 0.15);
          color: var(--accent-gold);
        }
        .message-bubble {
          padding: 16px 20px;
          border-radius: var(--radius-md);
        }
        .user-bubble {
          background: var(--accent-sage-soft);
          border: 1px solid var(--border-focus);
          color: var(--text-primary);
        }
        .bot-bubble {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }
        .bubble-paragraph {
          margin-bottom: 10px;
          line-height: 1.65;
          font-size: 0.95rem;
        }
        .bubble-paragraph:last-child {
          margin-bottom: 0;
        }
        .recommended-card {
          margin-top: 14px;
          padding: 12px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .recommended-card:hover {
          background: var(--accent-sage-soft);
          border-color: var(--border-focus);
          transform: translateY(-1px);
        }
        .rec-badge {
          font-size: 0.68rem;
          text-transform: uppercase;
          color: var(--accent-gold);
          letter-spacing: 0.06em;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .rec-title {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: var(--text-heading);
          margin-bottom: 6px;
        }
        .rec-action {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--accent-sage);
          font-weight: 500;
        }
        .typing-bubble {
          display: flex;
          gap: 6px;
          padding: 16px 20px;
        }
        .dot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-sage);
          animation: pulse 1.4s infinite ease-in-out both;
        }
        .dot-pulse:nth-child(2) { animation-delay: 0.2s; }
        .dot-pulse:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .suggested-prompts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .prompts-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .prompts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .suggested-btn {
          padding: 8px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 0.8rem;
          text-align: left;
          transition: var(--transition-smooth);
        }
        .suggested-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-heading);
        }
        .chat-input-bar {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: var(--radius-full);
          gap: 10px;
        }
        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-ui);
          font-size: 0.95rem;
          padding-left: 10px;
        }
        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 600px) {
          .prompts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
