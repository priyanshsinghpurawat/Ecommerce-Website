import api from './api.js';

export const createOrder = async (payload) => {
  // Attach attribution tag if it exists and hasn't expired
  const storedTag = localStorage.getItem('mensvibe_affiliate_tag');
  if (storedTag) {
    try {
      const parsed = JSON.parse(storedTag);
      if (parsed.expiry > Date.now()) {
        payload.attributionTag = parsed.tag;
      } else {
        localStorage.removeItem('mensvibe_affiliate_tag'); // Clean up expired
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  const { data } = await api.post('/orders', payload);
  return data;
};

export const createOrderWithTax = async (payload) => {
  // Same API call but with taxAmount included for cases where client calculates tax
  const storedTag = localStorage.getItem('mensvibe_affiliate_tag');
  if (storedTag) {
    try {
      const parsed = JSON.parse(storedTag);
      if (parsed.expiry > Date.now()) {
        payload.attributionTag = parsed.tag;
      } else {
        localStorage.removeItem('mensvibe_affiliate_tag');
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

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

export const updateOrderStatus = async (id, statusData) => {
  const payload = typeof statusData === 'object' ? statusData : { status: statusData };
  const { data } = await api.patch(`/orders/${id}/status`, payload);
  return data;
};

export const getOrderAnalytics = async () => {
  const { data } = await api.get('/orders/analytics');
  return data;
};
