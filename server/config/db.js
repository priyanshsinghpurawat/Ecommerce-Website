import mongoose from 'mongoose';
import { ENV } from './env.js';

const connectDB = async () => {
  try {
    // Setup mongoose connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connection established to database.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`Mongoose database connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose database connection disconnected.');
    });

    const options = {
      maxPoolSize: 10,                 // Avoid exhausting database connections
      serverSelectionTimeoutMS: 5000,  // Timeout quickly if database is down
      socketTimeoutMS: 45000,          // Close inactive sockets
    };

    const connectionInstance = await mongoose.connect(ENV.MONGODB_URI, options);
    console.log(`\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection FAILED: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
