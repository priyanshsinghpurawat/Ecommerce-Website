import 'dotenv/config';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'test-jwt-secret-key-must-be-at-least-32-chars-long';
  process.env.MONGODB_URI = process.env.MONGODB_URI || '=mongodb+srv://Priyansh:GW3NpW1rxRWe7LCW@code-engine.4me9sb0.mongodb.net/mensvibe?retryWrites=true&w=majority';
  process.env.PORT = '3000';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('production'),
  PORT: z.string().transform(Number).default('3000'),
  MONGODB_URI: z.string().optional(),
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
  const message = `Invalid environment variables: ${JSON.stringify(err, null, 2)}`;

  if (process.env.NODE_ENV === 'test') {
    console.warn(message + ' — continuing in test mode.');
  } else {
    console.error(message);
    process.exit(1);
  }
}

export const ENV = parsed.success
  ? parsed.data
  : {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: Number(process.env.PORT || 3000),
      MONGODB_URI: process.env.MONGODB_URI,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
      CORS_ORIGIN: process.env.CORS_ORIGIN,
    };
