import { createClient } from 'redis';
import { ENV } from './env.js';
import logger from './logger.js';

let redisClient;

const connectRedis = async () => {
  if (!ENV.REDIS_URL) {
    logger.warn('REDIS_URL not found in .env. Skipping Redis connection.');
    return null;
  }

  try {
    redisClient = createClient({
      url: ENV.REDIS_URL
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error:', err.message));
    redisClient.on('connect', () => logger.info('Redis Client Connecting...'));
    redisClient.on('ready', () => logger.info('Redis Client Ready'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis connection FAILED:', error.message);
    return null;
  }
};

export { connectRedis, redisClient };
