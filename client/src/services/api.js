/**
 * Shared HTTP client. Auth uses httpOnly cookie (withCredentials: true).
 * No tokens are stored in localStorage — the browser sends the cookie automatically.
 * Beginner docs: docs/DEVELOPER_GUIDE.md
 */
import axios from 'axios';

const api = axios.create({
  // In dev, Vite proxies /api → localhost:3000 (see vite.config.js)
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Send httpOnly auth cookie
});

// Clear cached user on 401 (cookie has expired or was invalidated server-side)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
