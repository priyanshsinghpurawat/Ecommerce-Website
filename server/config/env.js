import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env first so NODE_ENV is available for env-specific override
dotenv.config({ path: '.env' });
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.development';
dotenv.config({ path: envFile, override: true });

if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'test-jwt-secret-key-must-be-at-least-32-chars-long';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mensvibe-test';
  process.env.PORT = '3000';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  MONGODB_URI: z.string(),
  MONGODB_URI_TEST: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  COOKIE_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  SERVER_URL: z.string().url().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const err = parsed.error.format ? parsed.error.format() : parsed.error;
  console.error(`❌ Invalid environment variables: ${JSON.stringify(err, null, 2)}`);
  process.exit(1);
}

export const ENV = parsed.data;
