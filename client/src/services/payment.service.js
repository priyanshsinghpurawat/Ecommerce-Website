import api from './api.js';

export const getPaymentConfig = async () => {
  const { data } = await api.get('/payments/config');
  return data;
};

export const createCheckout = async (payload) => {
  const { data } = await api.post('/payments/checkout', payload);
  return data;
};

export const verifyPayment = async (payload) => {
  const { data } = await api.post('/payments/verify', payload);
  return data;
};
