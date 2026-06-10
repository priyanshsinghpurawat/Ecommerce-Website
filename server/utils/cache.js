import { LRUCache } from 'lru-cache';

// Process-bound LRU cache to prevent memory leaks/heap exhaustion.
// Limits size to 1000 entries and supports time-to-live (TTL).
const cacheStore = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 5 // default 5 minutes
});

/**
 * Get item from cache
 * @param {string} key - Cache key
 */
export const getCache = (key) => {
  return cacheStore.get(key) ?? null;
};

/**
 * Set item in cache with TTL
 * @param {string} key - Cache key
 * @param {*} value - Data to cache
 * @param {number} ttlSeconds - Time-to-live in seconds
 */
export const setCache = (key, value, ttlSeconds = 300) => {
  cacheStore.set(key, value, { ttl: ttlSeconds * 1000 });
};

/**
 * Evict item from cache
 * @param {string} key - Cache key
 */
export const deleteCache = (key) => {
  cacheStore.delete(key);
};

/**
 * Evict cache keys matching a pattern (e.g. invalidate all product caches on create/update)
 * @param {string} pattern - Substring to match keys
 */
export const clearCacheByPattern = (pattern) => {
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
};

/**
 * Clear the entire cache store
 */
export const clearCache = () => {
  cacheStore.clear();
};
// Force nodemon cache clear trigger

