import 'dotenv/config';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-must-be-at-least-32-chars-long';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://test';
  process.env.PORT = '3000';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
}


const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  PORT: z.string().transform(Number).default('3000'),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\/.+/, 'MONGODB_URI must be a valid MongoDB connection string'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('1d'),
  CORS_ORIGIN: z.string().default(''),
  // Optional but recommended for full functionality
  SERVER_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(env.error.format(), null, 2));
  process.exit(1);
}

export const ENV = env.data;
