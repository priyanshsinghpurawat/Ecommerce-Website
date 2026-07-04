# MensVibe — E-Commerce Platform

## Stack
- **Server**: Node 24+, Express 4, Mongoose 8, MongoDB Atlas, Socket.io, Razorpay, Cloudinary, JWT, Winston, Zod, Swagger
- **Client**: React 19, Vite 8, Tailwind 4, Framer Motion, React Router 7, Recharts, Axios
- **Test**: Vitest, Supertest, Testing Library, mongodb-memory-server

## Structure
```
server/
  config/        db.js, env.js, cloudinary.js, logger.js, socket.js
  models/        13 models (user, product, order, cart, coupon, review, variant, category, subcategory, affiliateLink, ledger, refreshToken, migrationCheckpoint)
  controllers/   14 controllers
  services/      coupon.service.js, order.service.js, product.service.js, variantFactory.js
  middleware/    auth.middleware.js, error.middleware.js, upload.middleware.js, validate.js
  routes/        All routes at /api/v3/x
  utils/         cloudinaryUpload.js, cron.js, email.js, helpers.js, jwt.js
  validators/
  tests/
client/
  src/
    pages/       Home, Shop, Cart, Checkout, ProductDetails, Profile, Orders, Wishlist, Login, Register, AboutUs, StreetDrip, SellerStore + admin/ + seller/
    components/
    context/     AuthContext, CartContext
    hooks/
    services/    Axios API client
    constants/
    utils/
```

## Key Commands
- `npm run dev:server` — Express on port 3000
- `npm run dev:client` — Vite on port 5173
- `npm run test` — Vitest (server + client)
- `npm run seed` — DB seeding (server)
- `npm run lint` — ESLint (server + client)

## API Version
All routes under `/api/v3/`:
- auth, categories, subcategories, products, cart, orders, coupons, payments, users, reviews, variants, affiliate, billing, newsletter

## Conventions
- ESM modules (`"type": "module"`)
- Async/await controllers, try-catch with next(error)
- MVC pattern: routes -> middleware -> controllers -> services -> models
- Zod for request validation
- Winston structured logging
- JWT auth with refresh tokens
- Razorpay payment gateway
- Cloudinary image upload via multer
- WebSocket via Socket.io (real-time updates)
- MongoDB indexes on slug, email, foreign keys
- API responses: `{ success: boolean, data/error/message }`
- .env in server/ (NODE_ENV=production, MONGODB_URI, JWT_SECRET, etc.)
