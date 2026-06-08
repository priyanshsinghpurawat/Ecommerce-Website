import { createContext, useState, useCallback } from 'react';
import * as productService from '../services/product.service.js';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProducts(params);
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
    setError(null);
    try {
      const response = await productService.createProduct(productData);
      if (response && response.success) {
        const newProduct = response.data;
        setProducts((prev) => [newProduct, ...prev]);
        return { success: true, product: newProduct };
      }
      return { success: false, error: response?.message || 'Failed to create product.' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create product.';
      return { success: false, error: message };
    }
  };

  const editProduct = async (id, productData) => {
    setError(null);
    try {
      const response = await productService.updateProduct(id, productData);
      if (response && response.success) {
        const updatedProduct = response.data;
        setProducts((prev) =>
          prev.map((prod) => (prod._id === id ? updatedProduct : prod))
        );
        return { success: true, product: updatedProduct };
      }
      return { success: false, error: response?.message || 'Failed to update product.' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update product.';
      return { success: false, error: message };
    }
  };

  const removeProduct = async (id) => {
    setError(null);
    try {
      const response = await productService.deleteProduct(id);
      if (response && response.success) {
        setProducts((prev) => prev.filter((prod) => prod._id !== id));
        return { success: true };
      }
      return { success: false, error: response?.message || 'Failed to delete product.' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete product.';
      return { success: false, error: message };
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        pagination,
        loading,
        error,
        fetchProducts,
        addProduct,
        editProduct,
        removeProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
