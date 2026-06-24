import { getCache, setCache } from '../utils/cache.js';

/**
 * Express middleware to cache GET responses.
 * @param {string} keyPrefix - Prefix for the cache key (e.g. 'products')
 * @param {number} ttlSeconds - Cache TTL in seconds (default: 300s/5m)
 */
export const cacheMiddleware = (keyPrefix, ttlSeconds = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Generate unique key based on route prefix, path, params, and query params
    const queryStr = JSON.stringify(req.query);
    const paramsStr = JSON.stringify(req.params);
    const cacheKey = `${keyPrefix}:${req.baseUrl || ''}${req.path}:${paramsStr}:${queryStr}`;

    try {
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        return res.status(200).json({
          statusCode: 200,
          data: cachedData,
          message: "Data retrieved successfully (cached)",
          success: true
        });
      }

      // Intercept res.json to capture response payload
      const originalJson = res.json;
      res.json = function (body) {
        res.json = originalJson; // Restore original json method

        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          const dataToCache = body.data !== undefined ? body.data : body;
          setCache(cacheKey, dataToCache, ttlSeconds).catch(err => {
            console.error('Async cache save failed:', err.message);
          });
        }

        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware execution failed:', error.message);
      next();
    }
  };
};
