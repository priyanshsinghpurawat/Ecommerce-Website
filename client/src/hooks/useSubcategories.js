import { useState, useCallback } from 'react';
import { getSubcategories } from '../services/subcategory.service.js';

const subcategoriesCache = {
  data: null,
  timestamp: 0,
  inflight: null,
  ttl: 5 * 60 * 1000,
};

export const useSubcategories = () => {
  const [subcategories, setSubcategories] = useState(subcategoriesCache.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubcategories = useCallback(async (categoryId) => {
    const cacheKey = categoryId || '__all__';
    const now = Date.now();

    if (subcategoriesCache.data && subcategoriesCache.cacheKey === cacheKey && now - subcategoriesCache.timestamp < subcategoriesCache.ttl) {
      setSubcategories(subcategoriesCache.data);
      return subcategoriesCache.data;
    }

    if (subcategoriesCache.inflight) {
      try {
        const data = await subcategoriesCache.inflight;
        setSubcategories(data);
        return data;
      } catch {
        return [];
      }
    }

    setLoading(true);
    setError(null);

    const fetchPromise = getSubcategories(categoryId)
      .then((response) => {
        const data = Array.isArray(response?.data) ? response.data : [];
        subcategoriesCache.data = data;
        subcategoriesCache.cacheKey = cacheKey;
        subcategoriesCache.timestamp = Date.now();
        setSubcategories(data);
        return data;
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch subcategories.');
        subcategoriesCache.data = [];
        setSubcategories([]);
        return [];
      })
      .finally(() => {
        setLoading(false);
        subcategoriesCache.inflight = null;
      });

    subcategoriesCache.inflight = fetchPromise;
    return fetchPromise;
  }, []);

  return { subcategories, loading, error, fetchSubcategories };
};
