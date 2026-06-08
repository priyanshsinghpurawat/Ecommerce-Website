/**
 * Express application setup: security middleware, API routes (images via Cloudinary).
 * Pattern: routes/*.js → controllers/*.js → models/*.js → MongoDB
 * Beginner docs: docs/DEVELOPER_GUIDE.md
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware.js';
import { sanitizeRequest } from './middleware/sanitize.middleware.js';

// Route imports
import authRouter from './routes/auth.routes.js';
import categoryRouter from './routes/category.routes.js';
import productRouter from './routes/product.routes.js';
import cartRouter from './routes/cart.routes.js';
import couponRouter from './routes/coupon.routes.js';
import orderRouter from './routes/order.routes.js';
import userRouter from './routes/user.routes.js';
import paymentRouter from './routes/payment.routes.js';
import subcategoryRouter from './routes/subcategory.routes.js';

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 50,
  message: { success: false, message: 'Too many login attempts. Wait a few minutes.' }
});

const configuredOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (configuredOrigins?.includes(origin)) {
      return callback(null, true);
    }
    if (!configuredOrigins?.length && isDev) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use(morgan("dev"));

// Route declarations
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/subcategories", subcategoryRouter);

// Root fallback route
app.get("/", (req, res) => {
  res.json({ ok: true, service: 'mensvibe-api', version: '1.0.0' });
});

app.get("/api/v1/health", (req, res) => {
  res.json({ ok: true });
});

// Centralized error handling middleware (must be mounted last)
app.use(errorHandler);

export { app };
