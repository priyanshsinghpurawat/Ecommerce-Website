/** WHY: Entry point to start the server and connect the database. */
import dotenv from 'dotenv';
dotenv.config();

import { ENV } from './config/env.js';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { app } from './app.js';
import { initInventoryCron } from './utils/cron.js';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis (Optional)
    if (ENV.REDIS_URL) {
      await connectRedis();
    }

    // Initialize background tasks
    initInventoryCron();

    const server = app.listen(ENV.PORT, () => {
      console.log(`MensVibe API → http://localhost:${ENV.PORT} [${ENV.NODE_ENV}]`);
    });

    // Handle process-level errors
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // In production, you might want to restart the process
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        // Close other connections here (DB, Redis)
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

