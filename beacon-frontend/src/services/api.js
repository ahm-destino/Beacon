/**
 * Beacon API Service
 * Connects the React frontend to the Flask backend.
 * Place this file at: src/services/api.js
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE_URL = BASE_URL;

const DEFAULT_TIMEOUT_MS = 12000;
const fetchWithTimeout = (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
};

const emitPointsRefresh = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('beacon-points-refresh'));
  }
};

const emitPointsEarned = (amount, detail = {}) => {
  if (typeof window === 'undefined') return;
  const pts = Number(amount || 0);
  if (pts <= 0) return;
  window.dispatchEvent(new CustomEvent('beacon-points-earned', {
    detail: { amount: pts, ...detail },
  }));
};

export const STREAK_MILESTONE_POINTS = {
  7: 100,
  14: 200,
  21: 300,
  30: 500,
  60: 1000,
  100: 2000,
};

const getHeaders = (isMultipart = false) => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('beacon_token')}`,
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (res, url) => {
  // Check for 401 Unauthorized
  if (res.status === 401 && !url?.includes('/auth/login') && !url?.includes('/auth/register')) {
    localStorage.removeItem('beacon_token');
    localStorage.setItem('beacon_session_expired', 'true');
    // Save current path to redirect back after login
    localStorage.setItem('beacon_redirect_after_login', window.location.pathname);
    window.location.href = '/auth/signin';
    return;
  }

  const data = await res.json();
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data;
};

const api = {
  get: (url) =>
    fetchWithTimeout(`${BASE_URL}${url}`, { headers: getHeaders() }).then((res) => handleResponse(res, url)),

  post: (url, data) =>
    fetchWithTimeout(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, url)),

  put: (url, data) =>
    fetchWithTimeout(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then((res) => handleResponse(res, url)),

  delete: (url) =>
    fetchWithTimeout(`${BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then((res) => handleResponse(res, url)),

  upload: (url, formData) =>
    fetchWithTimeout(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    }, 30000).then((res) => handleResponse(res, url)),

  /** Stream AI tutor response via Server-Sent Events */
  streamChat: (conversationId, message, options = {}, onChunk, onDone) => {
    const { explanationLevel, imageData, mimeType } = options;
    const token = localStorage.getItem('beacon_token');
    const url = `/api/ai-tutor/conversations/${conversationId}/messages`;
    
    fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        message, 
        explanation_level: explanationLevel,
        image_data: imageData,
        mime_type: mimeType,
      }),
    }).then(async (res) => {
      if (res.status === 401) {
        handleResponse(res, url);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Stream error' }));
        throw { status: res.status, ...err };
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') { onDone && onDone(); return; }
            try {
              const parsed = JSON.parse(raw);
              if (parsed.chunk) onChunk(parsed.chunk);
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {
              console.error('SSE Parse error', e);
            }
          }
        }
      }
      onDone && onDone();
    }).catch(err => {
      console.error('Stream failed:', err);
      // Fallback if component doesn't handle error
    });
  },
};

// ─── Auth Helpers ────────────────────────────────────────────────────────────
export const setToken = (token) => localStorage.setItem('beacon_token', token);
export const getToken = () => localStorage.getItem('beacon_token');
export const clearToken = () => localStorage.removeItem('beacon_token');
export const isLoggedIn = () => !!getToken();

// ─── Shortcut API calls ───────────────────────────────────────────────────────
  checkSession: () => api.get('/api/auth/me'), // Basic heartbeat
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  changePassword: (data) => api.post('/api/auth/change-password', data),
  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),
};

export const Users = {
  getMe: () => api.get('/api/users/me'),
  heartbeat: () => api.post('/api/users/me/heartbeat', {}),
  updateMe: (data) => api.put('/api/users/me', data),
  getStats: () => api.get('/api/users/me/stats'),
  getSubjects: () => api.get('/api/users/me/subjects'),
  getPoints: () => api.get('/api/users/me/points'),
  getBadges: () => api.get('/api/users/me/badges'),
  getReferral: () => api.get('/api/users/me/referral'),
};

export const Practice = {
  createSession: (data) => api.post('/api/practice/sessions', data),
  createJambFullSession: () => api.post('/api/practice/sessions/jamb-full', {}),
  getSessions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/practice/sessions${q ? `?${q}` : ''}`);
  },
  getSessionSnapshot: (sessionId) => api.get(`/api/practice/sessions/${sessionId}/snapshot`),
  submitAnswer: async (sessionId, data) => {
    const res = await api.post(`/api/practice/sessions/${sessionId}/answers`, data);
    // Use backend's authoritative points_earned (avoids duplicate logic)
    const pointsEarned = res?.data?.points_earned ?? 0;
    if (pointsEarned > 0) {
      emitPointsEarned(pointsEarned, {
        source: 'practice_answer',
        xp_breakdown: res?.data?.xp_breakdown || [],
      });
      emitPointsRefresh();
    }
    return res;
  },
  getOptionExplanation: (questionId, selectedOption) =>
    api.post(`/api/practice/questions/${questionId}/explanation`, {
      selected_option: selectedOption,
    }),
  updateSession: (sessionId, data) => api.put(`/api/practice/sessions/${sessionId}`, data),
  completeSession: async (sessionId) => {
    const res = await api.post(`/api/practice/sessions/${sessionId}/complete`);
    const celebration = res?.data?.celebration;
    // Fire streak milestone bonus if applicable
    const currentStreak = res?.data?.streak?.current_streak;
    const milestonePoints = STREAK_MILESTONE_POINTS[currentStreak];
    if (milestonePoints) {
      emitPointsEarned(milestonePoints, {
        source: 'streak_milestone',
        reason: `${currentStreak}-day streak milestone`,
      });
    }
    // 🎉 Emit celebration event for any component to consume
    if (celebration && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beacon-celebration', { detail: celebration }));
    }
    emitPointsRefresh();
    return res;
  },
  getBookmarks: () => api.get('/api/practice/bookmarks'),
  addBookmark: (qid) => api.post(`/api/practice/bookmarks/${qid}`),
  removeBookmark: (qid) => api.delete(`/api/practice/bookmarks/${qid}`),
};

export const Streaks = {
  getMe: () => api.get('/api/streaks/me'),
  getCalendar: () => api.get('/api/streaks/calendar'),
  useFreeze: async () => {
    const res = await api.post('/api/streaks/freeze/use');
    emitPointsRefresh();
    return res;
  },
  buyFreeze: async () => {
    const res = await api.post('/api/streaks/freeze/buy');
    emitPointsRefresh();
    return res;
  },
  repairFree: async () => {
    const res = await api.post('/api/streaks/repair/free');
    emitPointsRefresh();
    return res;
  },
  repairPoints: async () => {
    const res = await api.post('/api/streaks/repair/points');
    emitPointsRefresh();
    return res;
  },
  getSociety: () => api.get('/api/streaks/society'),
  getFriends: () => api.get('/api/streaks/friends'),
};

export const Subscriptions = {
  getPlans: () => api.get('/api/subscriptions/plans'),
  getMine: () => api.get('/api/subscriptions/me'),
  initialize: (data) => api.post('/api/subscriptions/initialize', data),
  verify: (reference) => api.post('/api/subscriptions/verify', { reference }),
  cancel: () => api.post('/api/subscriptions/cancel'),
};

export const Analytics = {
  weakAreas: () => api.get('/api/analytics/weak-areas'),
  dashboard: () => api.get('/api/analytics/dashboard'),
  prediction: () => api.get('/api/analytics/prediction'),
  subjects: () => api.get('/api/analytics/subjects'),
  trends: () => api.get('/api/analytics/trends'),
  errors: () => api.get('/api/analytics/errors'),
  heatmap: () => api.get('/api/analytics/heatmap'),
};

export const Admin = {
  dashboard: () => api.get('/api/admin/dashboard'),
  listUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/admin/users${q ? `?${q}` : ''}`);
  },
  getUser: (id) => api.get(`/api/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  getUserStats: (id) => api.get(`/api/admin/users/${id}/stats`),
  getUserSessions: (id, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/admin/users/${id}/sessions${q ? `?${q}` : ''}`);
  },
  banUser: (id) => api.post(`/api/admin/users/${id}/ban`, {}),
  unbanUser: (id) => api.post(`/api/admin/users/${id}/unban`, {}),
  updateSubscription: (id, data) => api.put(`/api/admin/users/${id}/subscription`, data),
  adjustPoints: (id, data) => api.post(`/api/admin/users/${id}/points`, data),

  listQuestions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/admin/questions${q ? `?${q}` : ''}`);
  },
  updateQuestion: (id, data) => api.put(`/api/admin/questions/${id}`, data),
  approveQuestion: (id) => api.post(`/api/admin/questions/${id}/approve`, {}),
  rejectQuestion: (id) => api.post(`/api/admin/questions/${id}/reject`, {}),

  listReports: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/admin/reports${q ? `?${q}` : ''}`);
  },
  resolveReport: (id, data) => api.post(`/api/admin/reports/${id}/resolve`, data),

  listAICorrections: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/admin/ai-corrections${q ? `?${q}` : ''}`);
  },
  approveAICorrection: (id, data) => api.post(`/api/admin/ai-corrections/${id}/approve`, data),
  rejectAICorrection: (id, data) => api.post(`/api/admin/ai-corrections/${id}/reject`, data),

  listAudit: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/admin/audit${q ? `?${q}` : ''}`);
  },

  analyticsSummary: () => api.get('/api/admin/analytics/summary'),
  analyticsEngagement: (days = 30) => api.get(`/api/admin/analytics/engagement?days=${days}`),
  analyticsSubjects: () => api.get('/api/admin/analytics/subjects'),
  analyticsAI: () => api.get('/api/admin/analytics/ai-usage'),
  analyticsSubscriptions: () => api.get('/api/admin/analytics/subscriptions'),

  broadcast: (data) => api.post('/api/admin/notifications/broadcast', data),
  systemHealth: () => api.get('/api/admin/system/health'),
};

export const Leaderboard = {
  global: (page = 1, limit = 200) =>
    api.get(`/api/leaderboard/global?page=${page}&limit=${limit}`),
  streakSociety: (page = 1, limit = 200) =>
    api.get(`/api/leaderboard/streak-society?page=${page}&limit=${limit}`),
  league: () => 
    api.get('/api/leaderboard/league'),
  leagueTrack: () =>
    api.get('/api/leaderboard/leagues'),
};

export const Notifications = {
  list: (page = 1) => api.get(`/api/notifications?page=${page}`),
  markRead: (id) => api.put(`/api/notifications/${id}/read`, {}),
  markAllRead: () => api.put('/api/notifications/read-all', {}),
};

export const Community = {
  listQuestions: (page = 1) => api.get(`/api/community/questions?page=${page}`),
  getQuestion: (id) => api.get(`/api/community/questions/${id}`),
  postQuestion: (data) => api.post('/api/community/questions', data),
  submitAnswer: (id, body) => api.post(`/api/community/questions/${id}/answers`, { body }),
  upvoteAnswer: (answerId) => api.post(`/api/community/answers/${answerId}/upvote`),
  markBestAnswer: (questionId, answerId) => api.put(`/api/community/questions/${questionId}/best-answer`, { answer_id: answerId }),
  
  listTutors: (params = {}) => {
    const filtered = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    const q = new URLSearchParams(filtered).toString();
    return api.get(`/api/community/tutors${q ? `?${q}` : ''}`);
  },
  getTutor: (id) => api.get(`/api/community/tutors/${id}`),
  rateTutor: (id, data) => api.post(`/api/community/tutors/${id}/rate`, data),
  
  // Buddies
  getBuddies: () => api.get('/api/community/buddies'), // Returns array of buddies now
  getBuddyRequests: () => api.get('/api/community/buddies/requests'),
  findBuddies: () => api.get('/api/community/buddies/find'),
  requestBuddy: (userId) => api.post('/api/community/buddies/request', { user_id: userId }),
  acceptBuddy: (relationshipId) => api.put(`/api/community/buddies/${relationshipId}/accept`, {}),
  endBuddy: (relationshipId) => api.delete(`/api/community/buddies/${relationshipId}`),
  getBuddyMessages: (limit = 50) => api.get(`/api/community/buddies/messages?limit=${limit}`),
  sendBuddyMessage: (body) => api.post('/api/community/buddies/messages', { body }),
  getBuddyTyping: () => api.get('/api/community/buddies/typing'),
  setBuddyTyping: (isTyping) => api.post('/api/community/buddies/typing', { is_typing: isTyping }),
  
  getStudent: (studentId) => api.get(`/api/community/students/${studentId}`),
  
  // Challenges
  listChallenges: (params) => {
    const q = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
    return api.get(`/api/community/challenges${q}`);
  },
  createChallenge: (data) => api.post('/api/community/challenges', data),
  getChallenge: (id) => api.get(`/api/community/challenges/${id}`),
  acceptChallenge: (id) => api.put(`/api/community/challenges/${id}/accept`, {}),
  declineChallenge: (id) => api.put(`/api/community/challenges/${id}/decline`, {}),
  pingOpponent: (id) => api.post(`/api/community/challenges/${id}/ping`),
  submitChallengeAnswer: (id, data) => api.post(`/api/community/challenges/${id}/answers`, data),
  completeChallenge: (id) => api.post(`/api/community/challenges/${id}/complete`, {}),
};

export const Onboarding = {
  getStatus: () => api.get('/api/onboarding/status'),
  welcome: (data) => api.post('/api/onboarding/welcome', data),
  personalSetup: (data) => api.post('/api/onboarding/personal-setup', data),
  examSelection: (data) => api.post('/api/onboarding/exam-selection', data),
  subjectSelection: (data) => api.post('/api/onboarding/subject-selection', data),
  saveHabits: (data) => api.post('/api/onboarding/habits', data),
  startDiagnostic: () => api.post('/api/onboarding/diagnostic/start'),
  skipDiagnostic: () => api.post('/api/onboarding/diagnostic/skip'),
  submitDiagnostic: (data) => api.post('/api/onboarding/diagnostic/submit', data),
  complete: () => api.post('/api/onboarding/complete'),
  forceComplete: () => api.post('/api/onboarding/force-complete'), // DEBUG
};

export const Flashcards = {
  // Decks
  listDecks: (page = 1) => api.get(`/api/flashcards/decks?page=${page}`),
  createDeck: (data) => api.post('/api/flashcards/decks', data),
  getDeck: (id) => api.get(`/api/flashcards/decks/${id}`),
  updateDeck: (id, data) => api.put(`/api/flashcards/decks/${id}`, data),
  deleteDeck: (id) => api.delete(`/api/flashcards/decks/${id}`),
  
  // Cards
  createCard: (deckId, data) => api.post(`/api/flashcards/decks/${deckId}/cards`, data),
  getCard: (id) => api.get(`/api/flashcards/cards/${id}`),
  updateCard: (id, data) => api.put(`/api/flashcards/cards/${id}`, data),
  deleteCard: (id) => api.delete(`/api/flashcards/cards/${id}`),
  
  // Study
  getDueCards: () => api.get('/api/flashcards/study'),
  getDeckDueCards: (deckId) => api.get(`/api/flashcards/decks/${deckId}/study`),
  reviewCard: (cardId, data) => api.post(`/api/flashcards/cards/${cardId}/review`, data),
  
  // Stats
  getStats: () => api.get('/api/flashcards/stats'),
  getDeckStats: (deckId) => api.get(`/api/flashcards/decks/${deckId}/stats`),
  
  // AI Generation
  generateFromTopic: (data) => api.post('/api/flashcards/generate/topic', data),
  saveFromAITutor: (data) => api.post('/api/flashcards/save/ai-tutor', data),
  saveFromWrongAnswer: (data) => api.post('/api/flashcards/save/wrong-answer', data),
};

export const Literature = {
  // Texts
  listTexts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/literature/texts?${q}`);
  },
  getText: (id) => api.get(`/api/literature/texts/${id}`),
  
  // Chapters
  getChapters: (textId) => api.get(`/api/literature/texts/${textId}/chapters`),
  getChapter: (textId, chapterNum) => api.get(`/api/literature/texts/${textId}/chapters/${chapterNum}`),
  
  // Characters & Themes
  getCharacters: (textId) => api.get(`/api/literature/texts/${textId}/characters`),
  getThemes: (textId) => api.get(`/api/literature/texts/${textId}/themes`),
  
  // Progress
  updateProgress: (textId, data) => api.post(`/api/literature/texts/${textId}/progress`, data),
  
  // Past Questions
  getPastQuestions: (textId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/api/literature/texts/${textId}/questions?${q}`);
  },
  getQuestion: (textId, questionId) => api.get(`/api/literature/texts/${textId}/questions/${questionId}`),
  
  // Quiz
  generateQuiz: (textId, data) => api.post(`/api/literature/texts/${textId}/quiz/generate`, data),
  
  // Challenge
  createChallenge: (textId, data) => api.post(`/api/literature/texts/${textId}/challenge`, data),
};

export const AITutor = {
  streamChat: api.streamChat,
  streamConceptExplain: api.streamConceptExplain,

  
  // Write mode
  startWriteSession: (data) => api.post('/api/ai-tutor/write/session', data),
  submitWrittenAnswer: (data) => api.post('/api/ai-tutor/write/submit', data),
  
  // Voice mode
  startVoiceSession: (data) => api.post('/api/ai-tutor/voice/session', data),
  submitVoiceAnswer: (data) => api.post('/api/ai-tutor/voice/answer', data),
  
  // Concept confidence
  rateConceptConfidence: (data) => api.post('/api/ai-tutor/concepts/confidence', data),
  generateConceptQuiz: (data) => api.post('/api/ai-tutor/concepts/quiz', data),
};

export default api;
