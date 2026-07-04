import express from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import logger from './config/logger.js';

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
import variantRouter from './routes/variant.routes.js';
import affiliateRouter from './routes/affiliate.routes.js';
import billingRouter from './routes/billing.routes.js';
import reviewRouter from './routes/review.routes.js';
import newsletterRouter from './routes/newsletter.routes.js';

const app = express();

if (ENV.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://via.placeholder.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  connectSrc: [
    "'self'",
    'https://api.razorpay.com',
    'https://res.cloudinary.com',
    'https://oauth2.googleapis.com',
    'https://accounts.google.com',
    'https://api.postalpincode.in',
    'https://api.zippopotam.us',
  ],
  frameSrc: ["'self'", 'https://accounts.google.com'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  ...(ENV.NODE_ENV === 'production' && { upgradeInsecureRequests: [] }),
};

app.use(
  helmet({
    // CORP: 'same-site' is correct for a pure JSON API server.
    crossOriginResourcePolicy: { policy: 'same-site' },

    // COOP: allow OAuth popup flows (Google sign-in)
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },

    // HSTS: enforce HTTPS for 1 year + preload in production
    strictTransportSecurity:
      ENV.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,

    // CSP: disabled in dev so Swagger UI (which loads its own scripts/styles
    // from Express) isn't blocked. In production, strict 'none' API policy.
    contentSecurityPolicy: ENV.NODE_ENV !== 'development' ? { directives: cspDirectives } : false,

    // X-XSS-Protection: explicitly disabled — modern browsers ignore it and
    // legacy parsers can be exploited by "1; mode=block".
    xXssProtection: false,

    // Referrer-Policy: don't leak full URL to third-party origins
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // X-Frame-Options: deny embedding in any iframe
    frameguard: { action: 'deny' },

    // X-Content-Type-Options: nosniff
    xContentTypeOptions: true,

    // X-Permitted-Cross-Domain-Policies: deny Flash/PDF cross-domain access
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  }),
);

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: ENV.NODE_ENV === 'production' ? 500 : 5000,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => ENV.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Wait a few minutes.' },
  skip: () => ENV.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true',
});

const configuredOrigins = ENV.CORS_ORIGIN?.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ENV.NODE_ENV !== 'production') return callback(null, true);
      if (configuredOrigins?.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(compression());
app.use(mongoSanitize());
app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));

if (ENV.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      logger.info('request', {
        method: req.method,
        path: req.originalUrl,
        userId: req.user?._id,
        ip: req.ip,
      });
    }
    next();
  });
}

app.use(generalLimiter);

// =========================================================================
// SWAGGER CONFIGURATION
// =========================================================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API Docs',
      version: '1.0.0',
      description: 'Interactive documentation for our E-commerce backend application',
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT || 3000}`,
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token to access protected endpoints',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'seller'] },
            phone: { type: 'string' },
            brandName: { type: 'string' },
            isActive: { type: 'boolean' },
            avatar: { type: 'string' },
            wishlist: { type: 'array', items: { type: 'string' } },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  phone: { type: 'string' },
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zipCode: { type: 'string' },
                  country: { type: 'string' },
                  isDefault: { type: 'boolean' },
                },
              },
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            discountedPrice: { type: 'number' },
            image: { type: 'string' },
            images: { type: 'array', items: { type: 'string' } },
            stock: { type: 'number' },
            rating: { type: 'number' },
            reviewCount: { type: 'number' },
            soldCount: { type: 'number' },
            badge: {
              type: 'string',
              enum: ['', 'new-arrival', 'sale', 'street-drip', 'limited-edition'],
            },
            category: { type: 'string' },
            subcategory: { type: 'string' },
            gender: { type: 'string', enum: ['men', 'women', 'unisex'] },
            seller: { type: 'string' },
            relatedProducts: { type: 'array', items: { type: 'string' } },
            variants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  color: { type: 'string' },
                  size: { type: 'string' },
                  sku: { type: 'string' },
                  stock: { type: 'number' },
                  price: { type: 'number' },
                  images: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        Coupon: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string' },
            discountType: { type: 'string', enum: ['percentage', 'flat'] },
            discountValue: { type: 'number' },
            minCartAmount: { type: 'number' },
            isActive: { type: 'boolean' },
            expiryDate: { type: 'string', format: 'date-time' },
            usageLimit: { type: 'integer' },
            usageCount: { type: 'integer' },
            perUserLimit: { type: 'integer' },
            newUsersOnly: { type: 'boolean' },
            appliedProducts: { type: 'array', items: { type: 'string' } },
            seller: { type: 'string' },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { $ref: '#/components/schemas/Product' },
                  quantity: { type: 'number' },
                  size: { type: 'string' },
                  color: { type: 'string' },
                },
              },
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderNumber: { type: 'string' },
            user: { type: 'string' },
            items: { type: 'array', items: { type: 'object' } },
            subtotal: { type: 'number' },
            taxAmount: { type: 'number' },
            discountAmount: { type: 'number' },
            total: { type: 'number' },
            shippingAddress: { type: 'object' },
            paymentMethod: { type: 'string' },
            paymentStatus: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./app.js', './routes/*.js'],
};

if (ENV.NODE_ENV !== 'production') {
  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// Route declarations
app.use('/api/v3/auth', authLimiter, authRouter);
app.use('/api/v3/users', userRouter);
app.use('/api/v3/categories', categoryRouter);
app.use('/api/v3/products', productRouter);
app.use('/api/v3', reviewRouter); // routes: /products/:id/reviews, /reviews/:reviewId
app.use('/api/v3/cart', cartRouter);
app.use('/api/v3/coupons', couponRouter);
app.use('/api/v3/orders', orderRouter);
app.use('/api/v3/payments', paymentRouter);
app.use('/api/v3/subcategories', subcategoryRouter);
app.use('/api/v3', variantRouter); // routes: /products/:id/variants, /variants/:id
app.use('/api/v3/affiliates', affiliateRouter);
app.use('/api/v3/billing', billingRouter);
app.use('/api/v3/newsletter', newsletterRouter);

// Root fallback route
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'mensvibe-api', version: '1.0.0' });
});

const startTime = Date.now();

app.get('/api/v3/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.json({
    ok: dbState === 1,
    uptime: Math.round((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    db: dbStatus[dbState] || 'unknown',
    memory: process.memoryUsage().rss,
  });
});

app.use(errorHandler);

export { app };
