/** WHY: Entry point to start the server and connect the database. */
import mongoose from 'mongoose';
import { ENV } from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis, redisClient } from './config/redis.js';
import { app } from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './config/socket.js';
import { initInventoryCron } from './utils/cron.js';
import { clearCache } from './utils/cache.js';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis (Optional)
    if (ENV.REDIS_URL) {
      await connectRedis();
    }

    // Flush cache on startup to clear any stale category or query cache
    await clearCache();
    console.log('Cache flushed successfully on startup.');

    // Initialize background tasks
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
      console.log(`MensVibe API → http://localhost:${ENV.PORT} [${ENV.NODE_ENV}]`);
    });

    // Handle process-level errors
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(async () => {
        try {
          await mongoose.disconnect();
          console.log('MongoDB connection closed.');
        } catch (err) {
          console.error('Error closing MongoDB connection:', err.message);
        }

        if (redisClient?.isReady) {
          try {
            await redisClient.quit();
            console.log('Redis connection closed.');
          } catch (err) {
            console.error('Error closing Redis connection:', err.message);
          }
        }
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${ENV.PORT} is in use. Run: npm run free-port`);
        process.exit(1);
      }
      throw err;
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
};

startServer();

