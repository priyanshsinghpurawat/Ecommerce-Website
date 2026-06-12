import { useState, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api.js';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCategories();
      if (response && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = async (name) => {
    try {
      const response = await createCategory(name);
      setCategories((prev) => [response.data, ...prev]);
      return { success: true, category: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create category.' };
    }
  };

  const editCategory = async (id, name) => {
    try {
      const response = await updateCategory(id, name);
      setCategories((prev) => prev.map((cat) => (cat._id === id ? response.data : cat)));
      return { success: true, category: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update category.' };
    }
  };

  const removeCategory = async (id) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete category.' };
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    editCategory,
    removeCategory
  };
};
