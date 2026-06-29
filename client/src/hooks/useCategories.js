import { useState, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/category.service.js';

const categoriesCache = {
  data: null,
  timestamp: 0,
  inflight: null,
  ttl: 5 * 60 * 1000,
};

export const useCategories = () => {
  const [categories, setCategories] = useState(categoriesCache.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    const now = Date.now();
    if (categoriesCache.data && now - categoriesCache.timestamp < categoriesCache.ttl) {
      setCategories(categoriesCache.data);
      return categoriesCache.data;
    }

    if (categoriesCache.inflight) {
      try {
        const data = await categoriesCache.inflight;
        setCategories(data);
        return data;
      } catch {
        return [];
      }
    }

    setLoading(true);
    setError(null);

    const fetchPromise = getCategories()
      .then((response) => {
        const data = Array.isArray(response?.data) ? response.data : [];
        categoriesCache.data = data;
        categoriesCache.timestamp = Date.now();
        setCategories(data);
        return data;
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch categories.');
        categoriesCache.data = [];
        setCategories([]);
        return [];
      })
      .finally(() => {
        setLoading(false);
        categoriesCache.inflight = null;
      });

    categoriesCache.inflight = fetchPromise;
    return fetchPromise;
  }, []);

  const addCategory = async (name) => {
    try {
      const response = await createCategory(name);
      categoriesCache.data = null;
      setCategories((prev) => [response.data, ...prev]);
      return { success: true, category: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create category.' };
    }
  };

  const editCategory = async (id, name) => {
    try {
      const response = await updateCategory(id, name);
      categoriesCache.data = null;
      setCategories((prev) => prev.map((cat) => (cat._id === id ? response.data : cat)));
      return { success: true, category: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update category.' };
    }
  };

  const removeCategory = async (id) => {
    try {
      await deleteCategory(id);
      categoriesCache.data = null;
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
