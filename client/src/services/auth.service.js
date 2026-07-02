import api from './api.js';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (name, email, password, role = 'user') => {
  const { data } = await api.post('/auth/register', { name, email, password, role });
  return data;
};

export const googleLogin = async (idToken) => {
  const { data } = await api.post('/auth/google-login', { idToken });
  return data;
};

export const me = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const logout = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data;
};
