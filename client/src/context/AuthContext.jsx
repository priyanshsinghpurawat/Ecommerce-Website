import { createContext, useState, useEffect } from 'react';
import * as authService from '../services/auth.service.js';
import { unwrapData, getErrorMessage } from '../utils/apiHelpers.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // On mount, revalidate the session against the server (httpOnly cookie).
  // We optionally seed UI from a cached `user` for snappier first render,
  // but the server's response is the source of truth for the role and identity.
  useEffect(() => {
    const cached = localStorage.getItem('user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('user');
      }
    }

    (async () => {
      try {
        const body = await authService.me();
        const fresh = unwrapData(body);
        if (fresh) {
          setUser(fresh);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(fresh));
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
        }
      } catch {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    })();
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

  const registerUser = async (name, email, password) => {
    try {
      const body = await authService.register(name, email, password);
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

  const logoutUser = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore — clear local state regardless */
    }
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
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
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
