import api from './api.js';

export const getSubcategories = async (categoryId) => {
  const params = categoryId ? { category: categoryId } : {};
  const { data } = await api.get('/subcategories', { params });
  return data;
};

export const createSubcategory = async (subData) => {
  const { data } = await api.post('/subcategories', subData);
  return data;
};

export const updateSubcategory = async (id, subData) => {
  const { data } = await api.put(`/subcategories/${id}`, subData);
  return data;
};

export const deleteSubcategory = async (id) => {
  const { data } = await api.delete(`/subcategories/${id}`);
  return data;
};


