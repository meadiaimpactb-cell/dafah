import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ── Request: attach Bearer token ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: handle 401 (session expired) ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401         = error.response?.status === 401;
    const hadToken      = !!error.config?.headers?.Authorization;

    // Only treat as "session expired" when the request actually carried a token.
    // A plain 401 from /auth/login (wrong password) carries no token → ignored.
    if (is401 && hadToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('currentView');
      window.dispatchEvent(new CustomEvent('session:expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
