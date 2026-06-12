/** WHY: In-memory LRU cache to speed up repeated database queries. */
import { LRUCache } from 'lru-cache';
import { redisClient } from '../config/redis.js';

// Process-bound LRU cache as fallback or for local caching
const localCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 5 // default 5 minutes
});

/**
 * Get item from cache (Redis or LRU fallback)
 */
export const getCache = async (key) => {
  try {
    if (redisClient?.isReady) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('Redis GET Error:', error.message);
  }
  return localCache.get(key) ?? null;
};

/**
 * Set item in cache
 * @param {string} key - Cache key
 * @param {*} value - Data to cache
 * @param {number} ttlSeconds - Time-to-live in seconds
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    if (redisClient?.isReady) {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds
      });
      return;
    }
  } catch (error) {
    console.error('Redis SET Error:', error.message);
  }
  localCache.set(key, value, { ttl: ttlSeconds * 1000 });
};

/**
 * Evict item from cache
 */
export const deleteCache = async (key) => {
  try {
    if (redisClient?.isReady) {
      await redisClient.del(key);
    }
  } catch (error) {
    console.error('Redis DEL Error:', error.message);
  }
  localCache.delete(key);
};

/**
 * Evict cache keys matching a pattern
 */
export const clearCacheByPattern = async (pattern) => {
  try {
    if (redisClient?.isReady) {
      const keys = await redisClient.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  } catch (error) {
    console.error('Redis Pattern Clear Error:', error.message);
  }
  
  for (const key of localCache.keys()) {
    if (key.includes(pattern)) {
      localCache.delete(key);
    }
  }
};

/**
 * Clear entire cache
 */
export const clearCache = async () => {
  try {
    if (redisClient?.isReady) {
      await redisClient.flushDb();
    }
  } catch (error) {
    console.error('Redis FLUSH Error:', error.message);
  }
  localCache.clear();
};
// Force nodemon cache clear trigger

