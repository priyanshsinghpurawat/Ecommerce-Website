import api from './api.js';

export const getCart = async () => {
  const { data } = await api.get('/cart');
  return data;
};

export const addToCart = async (productId, quantity = 1, metadata = {}) => {
  const { data } = await api.post('/cart/add', { productId, quantity, ...metadata });
  return data;
};

export const updateCartItemQuantity = async (itemId, quantity) => {
  const { data } = await api.put('/cart/update', { itemId, quantity });
  return data;
};

export const removeFromCart = async (itemId) => {
  const { data } = await api.delete(`/cart/remove/${itemId}`);
  return data;
};

export const clearCart = async () => {
  const { data } = await api.delete('/cart/clear');
  return data;
};

export const mergeCart = async (items) => {
  const { data } = await api.post('/cart/merge', { items });
  return data;
};
