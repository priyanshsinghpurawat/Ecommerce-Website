import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  MONGODB_URI: z.string().url('MONGODB_URI is required and must be a valid URL').default('mongodb://localhost:27017/mensvibe_test'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('super-secret-test-key-must-be-long-enough'),
  JWT_EXPIRY: z.string().default('1d'),
  CORS_ORIGIN: z.string().default('*'),
  // Optional but recommended for full functionality
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
