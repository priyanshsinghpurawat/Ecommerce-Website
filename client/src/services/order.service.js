import api from './api.js';

export const createOrder = async (payload) => {
  const { data } = await api.post('/orders', payload);
  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get('/orders/my');
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const getAllOrders = async (params = {}) => {
  const { data } = await api.get('/orders', { params });
  return data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data;
};

export const getOrderAnalytics = async () => {
  const { data } = await api.get('/orders/analytics');
  return data;
};
