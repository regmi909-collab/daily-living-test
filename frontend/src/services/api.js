const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("meditation_guru_token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Network request failed" }));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  googleAuth: (data) => request("/auth/google", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request("/auth/me"),

  // Dashboard
  getDashboardStats: () => request("/dashboard/stats"),

  // Meditation Sessions
  logSession: (data) => request("/sessions", { method: "POST", body: JSON.stringify(data) }),
  getSessions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sessions?${query}`);
  },

  // Content (Meditations, Videos, Blogs)
  getContent: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/content?${query}`);
  },
  getContentDetail: (idOrSlug) => request(`/content/${idOrSlug}`),
  getTags: () => request("/tags"),
  getTeachers: () => request("/teachers"),

  // AI Chatbot
  sendChatMessage: (message) => request("/chat/message", { method: "POST", body: JSON.stringify({ message }) }),
  getChatHistory: () => request("/chat/history"),

  // Admin / Creator Studio
  createContent: (data) => request("/admin/content", { method: "POST", body: JSON.stringify(data) }),
  updateContent: (id, data) => request(`/admin/content/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteContent: (id) => request(`/admin/content/${id}`, { method: "DELETE" }),
  getUploadUrl: (data) => request("/admin/upload-url", { method: "POST", body: JSON.stringify(data) }),
  syncYouTubeSingle: (data) => request("/admin/sync-youtube-single", { method: "POST", body: JSON.stringify(data) }),
  syncYouTubeFeed: (data) => request("/admin/sync-youtube-feed", { method: "POST", body: JSON.stringify(data) }),
  clearAllContent: () => request("/admin/clear-all-content", { method: "POST" }),
};

