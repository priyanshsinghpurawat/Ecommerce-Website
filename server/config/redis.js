import { createClient } from 'redis';
import { ENV } from './env.js';
import logger from './logger.js';

// WHY: exported as a getter, NOT a direct `let` export.
// ES module live bindings work for named exports, but importing modules
// that destructure `redisClient` at import-time receive `undefined` if
// Redis hasn't connected yet (or was skipped). A getter always returns
// the current value of the variable at call time.
let _redisClient = null;

export const getRedisClient = () => _redisClient;

// Backwards-compat alias so existing `redisClient?.isReady` callers keep working.
// Accessing `.redisClient` on the module namespace object gives the live binding.
export { _redisClient as redisClient };

const connectRedis = async () => {
  if (!ENV.REDIS_URL) {
    logger.warn('REDIS_URL not set — Redis disabled. Cache will use in-process LRU.');
    return null;
  }

  try {
    _redisClient = createClient({ url: ENV.REDIS_URL });

    _redisClient.on('error',       (err) => logger.error('Redis error:',       err.message));
    _redisClient.on('connect',     ()    => logger.info ('Redis connecting...'));
    _redisClient.on('ready',       ()    => logger.info ('Redis ready'));
    _redisClient.on('reconnecting',()    => logger.warn ('Redis reconnecting...'));
    _redisClient.on('end',         ()    => logger.warn ('Redis connection closed'));

    await _redisClient.connect();
    return _redisClient;
  } catch (error) {
    logger.error('Redis connection FAILED:', error.message);
    // Non-fatal: app continues with LRU-only caching
    _redisClient = null;
    return null;
  }
};

export { connectRedis };
