import api from './api.js';

export const getProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

/**
 * Create / update a product. Pass a `FormData` to upload files, or a plain
 * object for JSON. We DO NOT set Content-Type for FormData — axios + the
 * browser must add the multipart boundary themselves; setting it manually
 * strips the boundary and the server fails to parse.
 */
const isFormData = (v) => typeof FormData !== 'undefined' && v instanceof FormData;

export const createProduct = async (productData) => {
  const config = isFormData(productData) ? { headers: { 'Content-Type': undefined } } : {};
  const { data } = await api.post('/products', productData, config);
  return data;
};

export const updateProduct = async (id, productData) => {
  const config = isFormData(productData) ? { headers: { 'Content-Type': undefined } } : {};
  const { data } = await api.put(`/products/${id}`, productData, config);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};
