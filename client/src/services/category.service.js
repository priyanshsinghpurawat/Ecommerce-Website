import api from './api.js';

export const getCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};

export const getCategoryBySlug = async (slug) => {
  const { data } = await api.get(`/categories/${slug}`);
  return data;
};

export const createCategory = async (name) => {
  const { data } = await api.post('/categories', { name });
  return data;
};

export const updateCategory = async (id, name) => {
  const { data } = await api.put(`/categories/${id}`, { name });
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};
