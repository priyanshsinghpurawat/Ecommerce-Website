/** WHY: In-memory LRU cache to speed up repeated database queries. */
import { LRUCache } from 'lru-cache';
import { getRedisClient } from '../config/redis.js';
import logger from '../config/logger.js';

// Process-bound LRU cache as fallback when Redis is unavailable
const localCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 5 // default 5 minutes
});

/**
 * Get item from cache (Redis first, LRU fallback)
 */
export const getCache = async (key) => {
  try {
    const redis = getRedisClient();
    if (redis?.isReady) {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    logger.error('Redis GET error:', error.message);
  }
  return localCache.get(key) ?? null;
};

/**
 * Set item in cache
 * @param {string} key        - Cache key
 * @param {*}      value      - Data to cache
 * @param {number} ttlSeconds - Time-to-live in seconds (default 5 min)
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    const redis = getRedisClient();
    if (redis?.isReady) {
      await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    }
  } catch (error) {
    logger.error('Redis SET error:', error.message);
  }
  localCache.set(key, value, { ttl: ttlSeconds * 1000 });
};

/**
 * Evict a single key from cache
 */
export const deleteCache = async (key) => {
  try {
    const redis = getRedisClient();
    if (redis?.isReady) {
      await redis.del(key);
    }
  } catch (error) {
    logger.error('Redis DEL error:', error.message);
  }
  localCache.delete(key);
};

/**
 * Evict all cache keys matching a pattern via Redis Lua SCAN loop.
 * Uses SCAN (not KEYS) to avoid blocking the Redis event loop on large datasets.
 */
export const clearCacheByPattern = async (pattern) => {
  try {
    const redis = getRedisClient();
    if (redis?.isReady) {
      const script = `
        local cursor = "0"
        local deleted = 0
        repeat
          local reply = redis.call('SCAN', cursor, 'MATCH', ARGV[1], 'COUNT', ARGV[2])
          cursor = reply[1]
          for i = 1, #reply[2] do
            redis.call('DEL', reply[2][i])
            deleted = deleted + 1
          end
        until cursor == "0"
        return deleted
      `;
      await redis.eval(script, { arguments: [`*${pattern}*`, '1000'] });
    }
  } catch (error) {
    logger.error('Redis pattern-clear error:', error.message);
  }

  // Also clear matching keys from the local LRU
  for (const key of localCache.keys()) {
    if (key.includes(pattern)) {
      localCache.delete(key);
    }
  }
};

/**
 * Clear ALL app-owned cache keys by namespace pattern.
 * WHY: We do NOT call redis.flushDb() — that would wipe the entire Redis
 * database, including data owned by other services sharing the same instance.
 * Instead, callers must pass the namespace prefix they own (e.g. 'products:').
 */
export const clearCache = async (namespacePattern = '') => {
  if (!namespacePattern) {
    // Safety guard: refuse to clear without a pattern to prevent accidental flushDb
    logger.warn('clearCache() called without a namespacePattern — no-op to prevent full DB wipe.');
    localCache.clear();
    return;
  }
  await clearCacheByPattern(namespacePattern);
};
