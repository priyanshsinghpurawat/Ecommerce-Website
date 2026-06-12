import mongoose from 'mongoose';
import { ENV } from './env.js';

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`\nMongoDB connected! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection FAILED: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
