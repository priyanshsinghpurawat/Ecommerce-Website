import { useState, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api.js';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProducts(params);
      if (response && response.success && response.data) {
        setProducts(response.data.products || []);
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.totalProducts || 0
        });
      } else {
        setProducts([]);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (productData) => {
    try {
      const response = await createProduct(productData);
      if (response && response.success) {
        setProducts((prev) => [response.data, ...prev]);
        return { success: true, product: response.data };
      }
      return { success: false, error: response?.message || 'Failed to create product.' };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create product.' };
    }
  };

  const editProduct = async (id, productData) => {
    try {
      const response = await updateProduct(id, productData);
      if (response && response.success) {
        setProducts((prev) => prev.map((prod) => (prod._id === id ? response.data : prod)));
        return { success: true, product: response.data };
      }
      return { success: false, error: response?.message || 'Failed to update product.' };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update product.' };
    }
  };

  const removeProduct = async (id) => {
    try {
      const response = await deleteProduct(id);
      if (response && response.success) {
        setProducts((prev) => prev.filter((prod) => prod._id !== id));
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to delete product.' };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete product.' };
    }
  };

  return {
    products,
    pagination,
    loading,
    error,
    fetchProducts,
    addProduct,
    editProduct,
    removeProduct
  };
};
