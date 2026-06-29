/**
 * Shared HTTP client. Auth uses httpOnly cookie (withCredentials: true).
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v3',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      if (localStorage.getItem('user')) {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
