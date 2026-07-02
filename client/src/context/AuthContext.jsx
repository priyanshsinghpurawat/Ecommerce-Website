/** WHY: Global state for the logged-in user (session, roles, logout). */
import { createContext, useState, useEffect, useRef } from 'react';
import * as authService from '../services/auth.service.js';
import { unwrapData, getErrorMessage } from '../utils/helpers.js';

const SESSION_CACHE_KEY = 'auth_session';
const SESSION_TTL = 5 * 60 * 1000; // 5 minutes

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const verifySessionRef = useRef(null);

  // On mount, revalidate the session against the server (httpOnly cookie).
  // We optionally seed UI from a cached `user` for snappier first render,
  // but the server's response is the source of truth for the role and identity.
  useEffect(() => {
    let isMounted = true;
    const cached = localStorage.getItem('user');

    if (cached) {
      try {
        setUser(JSON.parse(cached));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('user');
      }
    }

    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem(SESSION_CACHE_KEY);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const verifySession = async () => {
      if (verifySessionRef.current) {
        return verifySessionRef.current;
      }

      verifySessionRef.current = (async () => {
        try {
          // Check session cache first
          const cachedSession = localStorage.getItem(SESSION_CACHE_KEY);
          if (cachedSession) {
            try {
              const { user: cachedUser, timestamp } = JSON.parse(cachedSession);
              if (Date.now() - timestamp < SESSION_TTL) {
                if (!isMounted) return;
                setUser(cachedUser);
                setIsAuthenticated(true);
                return;
              }
            } catch {
              localStorage.removeItem(SESSION_CACHE_KEY);
            }
          }

          const body = await authService.me();
          if (!isMounted) return;

          const fresh = unwrapData(body);
          if (fresh) {
            setUser(fresh);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(fresh));
            localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({
              user: fresh,
              timestamp: Date.now()
            }));
          } else {
            throw new Error('No user data');
          }
        } catch (err) {
          if (!isMounted) return;
          // Only clear auth on explicit 401, not on network errors during initial load
          if (err?.response?.status === 401) {
            handleUnauthorized();
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      })();

      return verifySessionRef.current;
    };

    verifySession();

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const handleAuthSuccess = (body) => {
    const payload = unwrapData(body);
    if (!payload?.user) {
      throw new Error('Server returned an incomplete login response.');
    }
    const { user: userData } = payload;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return { success: true, user: userData };
  };

  const loginUser = async (email, password) => {
    try {
      const body = await authService.login(email, password);
      return handleAuthSuccess(body);
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Login failed.') };
    }
  };

  const registerUser = async (name, email, password, role = 'user') => {
    try {
      const body = await authService.register(name, email, password, role);
      return handleAuthSuccess(body);
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Registration failed.') };
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const body = await authService.googleLogin(idToken);
      return handleAuthSuccess(body);
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Google login failed.') };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const body = await authService.forgotPassword(email);
      return { success: true, message: body?.message || 'Check your email for the reset link.' };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Failed to send reset email.') };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const body = await authService.resetPassword(token, password);
      return handleAuthSuccess(body);
    } catch (error) {
      return { success: false, error: getErrorMessage(error, 'Failed to reset password.') };
    }
  };

  const logoutUser = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore — clear local state regardless */
    }
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth:unauthorized'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        loading,
        loginUser,
        registerUser,
        loginWithGoogle,
        logoutUser,
        forgotPassword,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
