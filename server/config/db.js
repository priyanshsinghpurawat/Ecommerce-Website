import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

const connectDB = async (retries = 3, delay = 5000) => {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connection established to database.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Mongoose database connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose database connection disconnected.');
    });

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
      retryWrites: true,
      retryReads: true,
      bufferCommands: false,
    };

    const connectionInstance = await mongoose.connect(ENV.MONGODB_URI, options);
    logger.info(`MongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection FAILED: ${error.message}`);
    if (retries > 0) {
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 2000; // 0-2 seconds
      const totalDelay = delay + jitter;
      logger.warn(`Retrying connection in ${Math.round(totalDelay)}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
      return connectDB(retries - 1, delay * 2);
    }
    process.exit(1);
  }
};

export default connectDB;
