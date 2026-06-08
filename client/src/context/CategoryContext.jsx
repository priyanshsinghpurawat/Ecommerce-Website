import { createContext, useState, useCallback } from 'react';
import * as categoryService from '../services/category.service.js';

export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getCategories();
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
    setError(null);
    try {
      const response = await categoryService.createCategory(name);
      // Append newly created category to local list
      setCategories((prev) => [response.data, ...prev]);
      return { success: true, category: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create category.';
      return { success: false, error: message };
    }
  };

  const editCategory = async (id, name) => {
    setError(null);
    try {
      const response = await categoryService.updateCategory(id, name);
      // Update targeted category locally
      setCategories((prev) =>
        prev.map((cat) => (cat._id === id ? response.data : cat))
      );
      return { success: true, category: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update category.';
      return { success: false, error: message };
    }
  };

  const removeCategory = async (id) => {
    setError(null);
    try {
      await categoryService.deleteCategory(id);
      // Evict deleted category locally
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete category.';
      return { success: false, error: message };
    }
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        fetchCategories,
        addCategory,
        editCategory,
        removeCategory
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};
