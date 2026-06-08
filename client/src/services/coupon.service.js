import api from './api.js';

export const getCoupons = async (params = {}) => {
  const response = await api.get('/coupons', { params });
  return response.data;
};

export const createCoupon = async (couponData) => {
  const response = await api.post('/coupons', couponData);
  return response.data;
};

export const updateCoupon = async (id, couponData) => {
  const response = await api.put(`/coupons/${id}`, couponData);
  return response.data;
};

export const deleteCoupon = async (id) => {
  const response = await api.delete(`/coupons/${id}`);
  return response.data;
};

export const applyCoupon = async (code, cartTotal, cartItems = []) => {
  const response = await api.post('/coupons/apply', { code, cartTotal, cartItems });
  return response.data;
};
