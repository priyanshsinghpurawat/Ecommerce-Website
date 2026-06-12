import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';

export const useShopFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchProducts } = useProducts();

  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');

  // Derived filters
  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    badge: searchParams.get('badge') || '',
    sort: searchParams.get('sort') || 'latest',
    page: Number(searchParams.get('page')) || 1,
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    color: searchParams.get('color') || '',
  }), [searchParams]);

  const selectedColors = useMemo(() => 
    filters.color ? filters.color.split(',').filter(Boolean) : [], 
    [filters.color]
  );

  const hasActiveFilters = useMemo(() => 
    !!(filters.category || filters.subcategory || filters.badge || filters.minPrice || filters.maxPrice || filters.color || filters.search),
    [filters]
  );

  const updateFilters = useCallback((newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val) updated.set(key, val);
      else updated.delete(key);
    });
    
    // Reset page if filters change
    if (!('page' in newParams)) updated.set('page', '1');
    
    // Category/Subcategory logic
    if (newParams.category !== undefined && !newParams.subcategory) updated.delete('subcategory');
    
    setSearchParams(updated);
  }, [searchParams, setSearchParams]);

  const toggleColor = useCallback((colorName) => {
    const current = new Set(selectedColors);
    if (current.has(colorName)) current.delete(colorName);
    else current.add(colorName);
    updateFilters({ color: [...current].join(',') || '' });
  }, [selectedColors, updateFilters]);

  const applyPriceFilter = useCallback(() => {
    updateFilters({ minPrice: priceMin || '', maxPrice: priceMax || '' });
  }, [priceMin, priceMax, updateFilters]);

  const clearAllFilters = useCallback(() => {
    setPriceMin('');
    setPriceMax('');
    updateFilters({ 
      search: '', category: '', subcategory: '', badge: '', 
      sort: 'latest', minPrice: '', maxPrice: '', color: '', page: '1' 
    });
  }, [updateFilters]);

  return {
    filters,
    selectedColors,
    hasActiveFilters,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    updateFilters,
    toggleColor,
    applyPriceFilter,
    clearAllFilters,
    fetchProducts
  };
};
