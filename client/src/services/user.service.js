import api from './api.js';

export const getProfile = async () => {
  const { data } = await api.get('/users/me');
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put('/users/me', payload);
  return data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const { data } = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const getAllUsers = async () => {
  const { data } = await api.get('/users');
  return data;
};

export const updateUserRole = async (id, role) => {
  const { data } = await api.patch(`/users/${id}/role`, { role });
  return data;
};

export const getVendors = async () => {
  const { data } = await api.get('/users/vendors');
  return data;
};

export const toggleVendorStatus = async (id) => {
  const { data } = await api.patch(`/users/vendors/${id}/status`);
  return data;
};

export const getVendorProfile = async (id) => {
  const { data } = await api.get(`/users/vendors/${id}`);
  return data;
};

export const addAddress = async (payload) => {
  const { data } = await api.post('/users/addresses', payload);
  return data;
};

export const updateAddress = async (id, payload) => {
  const { data } = await api.put(`/users/addresses/${id}`, payload);
  return data;
};

export const deleteAddress = async (id) => {
  const { data } = await api.delete(`/users/addresses/${id}`);
  return data;
};

export const setDefaultAddress = async (id) => {
  const { data } = await api.patch(`/users/addresses/${id}/default`);
  return data;
};

export const getWishlist = async () => {
  const { data } = await api.get('/users/wishlist');
  return data;
};

export const addToWishlist = async (productId) => {
  const { data } = await api.post('/users/wishlist', { productId });
  return data;
};

export const removeFromWishlist = async (productId) => {
  const { data } = await api.delete(`/users/wishlist/${productId}`);
  return data;
};
