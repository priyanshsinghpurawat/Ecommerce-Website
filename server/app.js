/** WHY: Configures Express middleware, security, and main API routes. */
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// SameSite cookie configurations are handled in auth.controller.js and other cookie-setting controllers.
import { ENV } from './config/env.js';
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

app.disable('x-powered-by');

if (ENV.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: ENV.NODE_ENV === 'production' ? 500 : 5000,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many login attempts. Wait a few minutes.' },
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true'
});

const configuredOrigins = ENV.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (configuredOrigins?.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CSRF Protection is omitted. SameSite cookie attributes (lax/strict) are used for basic CSRF mitigation.

// Apply general rate limit to all routes
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
                  isDefault: { type: 'boolean' }
                }
              }
            }
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
            badge: { type: 'string', enum: ['', 'new-arrival', 'sale', 'street-drip', 'limited-edition'] },
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
                  images: { type: 'array', items: { type: 'string' } }
                }
              }
            }
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
  // Tell Swagger to scan this file and route files for documentation comments
  apis: ['./app.js', './routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Route declarations
app.use("/api/v3/auth", authLimiter, authRouter);
app.use("/api/v3/users", userRouter);
app.use("/api/v3/categories", categoryRouter);
app.use("/api/v3/products", productRouter);
app.use("/api/v3/cart", cartRouter);
app.use("/api/v3/coupons", couponRouter);
app.use("/api/v3/orders", orderRouter);
app.use("/api/v3/payments", paymentRouter);
app.use("/api/v3/subcategories", subcategoryRouter);

// Root fallback route
app.get("/", (req, res) => {
  res.json({ ok: true, service: 'mensvibe-api', version: '1.0.0' });
});

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Retrieve a list of all products
 *     description: Returns a mock array of items available in the e-commerce store.
 *     responses:
 *       200:
 *         description: Successfully retrieved the product list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   price:
 *                     type: number
 */
app.get('/api/products', (req, res) => {
  res.status(200).json([
    { id: 1, title: "white shirt", price: 499 },
    { id: 2, title: "blue pant", price: 299 }
  ]);
});

app.get("/api/v3/health", (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV 
  });
});

// Centralized error handling middleware (must be mounted last)
app.use(errorHandler);

export { app };
