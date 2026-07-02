import mongoose from 'mongoose';
import { ENV } from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis, redisClient } from './config/redis.js';
import { app } from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './config/socket.js';
import { initInventoryCron } from './utils/cron.js';
import { clearCacheByPattern } from './utils/cache.js';
import logger from './config/logger.js';


const startServer = async () => {
  try {
    // Parallelize DB and Redis connections to avoid blocking
    const initPromises = [connectDB()];
    if (ENV.REDIS_URL) {
      initPromises.push(connectRedis());
    }
    await Promise.all(initPromises);

    // Clear only app-owned cache keys — not the whole Redis DB.
    // flushDb() would wipe other services' data in shared Redis environments.
    await clearCacheByPattern('products:');
    await clearCacheByPattern('categories:');
    logger.info('App cache cleared on startup');

    initInventoryCron();

    const httpServer = createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: ENV.CORS_ORIGIN?.split(',').map(o => o.trim()).filter(Boolean) || true,
        credentials: true
      }
    });

    setupSocket(io);

    const server = httpServer.listen(ENV.PORT, () => {
      logger.info(`Server started on port ${ENV.PORT}`, { env: ENV.NODE_ENV });
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    const shutdown = async () => {
      logger.info('Shutting down server gracefully...');

      // Priority 1: Redis cleanup (preserve data priority)
      const shutdownTasks = [];

      shutdownTasks.push(
        (async () => {
          try {
            if (redisClient?.isReady) {
              await redisClient.quit();
              logger.info('Redis disconnected');
            }
          } catch (err) {
            logger.error('Redis shutdown error', { error: err.message });
          }
        })()
      );

      shutdownTasks.push(
        (async () => {
          try {
            io.close();
          } catch (err) {
            logger.error('Socket shutdown error', { error: err.message });
          }
        })()
      );

      shutdownTasks.push(
        (async () => {
          try {
            await new Promise((resolve) => {
              httpServer.close(() => {
                logger.info('HTTP server closed gracefully');
                resolve();
              });
              // Fallback timeout for forced shutdown
              setTimeout(() => {
                logger.warn('HTTP server forced close after timeout');
                resolve();
              }, 30000);
            });
          } catch (err) {
            logger.error('HTTP server shutdown error', { error: err.message });
          }
        })()
      );

      shutdownTasks.push(
        (async () => {
          try {
            await mongoose.disconnect({ force: true, timeout: 30000 });
            logger.info('MongoDB disconnected');
          } catch (err) {
            logger.error('MongoDB shutdown error', { error: err.message });
          }
        })()
      );

      await Promise.allSettled(shutdownTasks.map(task => task.catch(err => logger.error('Shutdown task failed', { error: err.message }))));

      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error('Port in use', { port: ENV.PORT });
        process.exit(1);
      }
      throw err;
    });
  } catch (err) {
    logger.error('Server startup failed', { error: err.message });
    process.exit(1);
  }
};

// Execute startup with proper async queue management to prevent unhandled synchronous floating promises
Promise.resolve()
  .then(() => startServer())
  .then(() => logger.info('Server initialization queue completed successfully'))
  .catch((err) => {
    logger.error('Fatal queue error during startup', { error: err.message });
    process.exit(1);
  });

