import api from './api.js';

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategoryBySlug = async (slug) => {
  const response = await api.get(`/categories/${slug}`);
  return response.data;
};

export const createCategory = async (name) => {
  const response = await api.post('/categories', { name });
  return response.data;
};

export const updateCategory = async (id, name) => {
  const response = await api.put(`/categories/${id}`, { name });
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};
