import { useState, useCallback } from 'react';

export const useCachedCRUD = ({ fetchFn, createFn, updateFn, deleteFn, name, ttl = 5 * 60 * 1000 }) => {
  const [cache] = useState({
    data: null,
    timestamp: 0,
    inflight: null,
    ttl,
  });

  const [items, setItems] = useState(cache.data || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    const now = Date.now();
    if (cache.data && now - cache.timestamp < cache.ttl) {
      setItems(cache.data);
      return cache.data;
    }

    if (cache.inflight) {
      try {
        const data = await cache.inflight;
        setItems(data);
        return data;
      } catch {
        return [];
      }
    }

    setLoading(true);
    setError(null);

    const fetchPromise = fetchFn()
      .then((response) => {
        const data = Array.isArray(response?.data) ? response.data : [];
        cache.data = data;
        cache.timestamp = Date.now();
        setItems(data);
        return data;
      })
      .catch((err) => {
        setError(err.response?.data?.message || `Failed to fetch ${name}s.`);
        cache.data = [];
        setItems([]);
        return [];
      })
      .finally(() => {
        setLoading(false);
        cache.inflight = null;
      });

    cache.inflight = fetchPromise;
    return fetchPromise;
  }, [fetchFn, cache, name]);

  const addItem = async (payload) => {
    try {
      const response = await createFn(payload);
      cache.data = null;
      setItems((prev) => [response.data, ...prev]);
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || `Failed to create ${name}.` };
    }
  };

  const editItem = async (id, payload) => {
    try {
      const response = await updateFn(id, payload);
      cache.data = null;
      setItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || `Failed to update ${name}.` };
    }
  };

  const removeItem = async (id) => {
    try {
      await deleteFn(id);
      cache.data = null;
      setItems((prev) => prev.filter((item) => item._id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || `Failed to delete ${name}.` };
    }
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    editItem,
    removeItem,
  };
};
