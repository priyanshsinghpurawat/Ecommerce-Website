import api from './api.js';

export const getCoupons = async (params = {}) => {
  const { data } = await api.get('/coupons', { params });
  return data;
};

export const createCoupon = async (couponData) => {
  const { data } = await api.post('/coupons', couponData);
  return data;
};

export const updateCoupon = async (id, couponData) => {
  const { data } = await api.put(`/coupons/${id}`, couponData);
  return data;
};

export const deleteCoupon = async (id) => {
  const { data } = await api.delete(`/coupons/${id}`);
  return data;
};

export const applyCoupon = async (code, cartTotal, cartItems = []) => {
  const { data } = await api.post('/coupons/apply', { code, cartTotal, cartItems });
  return data;
};
