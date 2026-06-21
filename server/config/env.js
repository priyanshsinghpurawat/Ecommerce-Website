import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging'])
    .default('production'),
  PORT: z.string().transform(Number).default('3000'),
  MONGODB_URI: z.string().optional(),
  MONGODB_URI_TEST: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  COOKIE_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const err = parsed.error.format ? parsed.error.format() : parsed.error;
  const message = `❌ Invalid environment variables: ${JSON.stringify(err, null, 2)}`;

  // In CI/tests we prefer not to hard-fail the process; tests often provide
  // environment at runtime or mock required services. Only hard-fail in
  // non-test environments to avoid breaking local development iteratively.
  if (process.env.NODE_ENV === 'test' || process.env.CI === 'true') {
    // Log a warning but continue — tests can set/override individual vars as needed.
    // Export a permissive ENV object that falls back to process.env values.
    // This avoids an abrupt process.exit which makes test runners fail early.
    // eslint-disable-next-line no-console
    console.warn(message + ' — continuing in test/CI mode.');
  } else {
    // eslint-disable-next-line no-console
    console.error(message);
    // Non-test environments should not start with invalid configuration.
    process.exit(1);
  }
}

// Export a best-effort ENV: prefer validated values when available, else fall back
// to raw process.env. This keeps behavior stable in tests while ensuring
// production still enforces validation.
export const ENV = parsed.success
  ? parsed.data
  : {
      NODE_ENV: process.env.NODE_ENV || 'test',
      PORT: Number(process.env.PORT || 3000),
      MONGODB_URI: process.env.MONGODB_URI,
      MONGODB_URI_TEST: process.env.MONGODB_URI_TEST,
      JWT_SECRET: process.env.JWT_SECRET,
      COOKIE_SECRET: process.env.COOKIE_SECRET,
      REDIS_URL: process.env.REDIS_URL,
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    };
