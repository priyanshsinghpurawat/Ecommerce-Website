import api from './api.js';

export const getProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProductFilters = async () => {
  const { data } = await api.get('/products/filters');
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const getFrequentlyBoughtTogether = async (id) => {
  const { data } = await api.get(`/products/${id}/frequently-bought-together`);
  return data;
};

export const createProduct = async (productData) => {
  const config =
    productData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await api.post('/products', productData, config);
  return data;
};

export const updateProduct = async (id, productData) => {
  const config =
    productData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await api.put(`/products/${id}`, productData, config);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

// Variant API calls
export const getProductVariants = async (productId) => {
  const { data } = await api.get(`/products/${productId}/variants`);
  return data;
};

export const deleteVariant = async (variantId) => {
  const { data } = await api.delete(`/variants/${variantId}`);
  return data;
};

// Review API calls
export const getProductReviews = async (productId) => {
  const { data } = await api.get(`/products/${productId}/reviews`);
  return data;
};

export const submitReview = async (productId, reviewData) => {
  const config =
    reviewData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
  const { data } = await api.post(`/products/${productId}/reviews`, reviewData, config);
  return data;
};
