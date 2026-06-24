
import { createClient } from 'redis';
import { ENV } from './env.js';

let redisClient;

const connectRedis = async () => {
  if (!ENV.REDIS_URL) {
    console.warn('REDIS_URL not found in .env. Skipping Redis connection.');
    return null;
  }

  try {
    redisClient = createClient({
      url: ENV.REDIS_URL
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('Redis Client Connecting...'));
    redisClient.on('ready', () => console.log('Redis Client Ready'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection FAILED: ', error.message);
    // We don't exit process here because Redis might be optional
    return null;
  }
};

export { connectRedis, redisClient };
