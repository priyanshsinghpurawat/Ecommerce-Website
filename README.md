# MensVibe — MERN E-Commerce Platform

[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

A high-performance, production-ready MERN stack men's clothing & footwear boutique. Features a modern storefront built with rich UX aesthetics, dedicated seller/admin dashboard, real checkout orchestration with automated inventory tracking, promo coupon support, centralized validation, and an LRU caching layer.

---

## 📖 Complete Documentation

*   **[docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)** — Architectural tour, project structures, and schema designs.
*   **[docs/DEPLOY_v1.md](docs/DEPLOY_v1.md)** — Comprehensive Render + Cloudinary production deployment walkthrough.

---

## ✨ Features

### 🛍️ Storefront & User Experience
*   **Dynamic Catalog & Search**: Advanced multi-facet filtering (categories, subcategories, price ranges) and real-time regex search.
*   **Atomic Checkout**: Shopping cart with quantity validation, automated coupon reductions, and robust transaction processing.
*   **Advanced Forms**: Fully guarded login and registration forms built with `react-hook-form` + `zod` featuring:
    *   Inline validation errors.
    *   Dynamic visual **Password Strength Meter**.
    *   CapsLock activation detection.
    *   Show/hide password toggles.
    *   Local storage "Remember my email" persistence.
*   **Aesthetic UI**:  dark-mode accents, glassmorphic card overlays, fluid micro-animations (Framer Motion), and responsive layout transitions.

### 🛡️ Admin & Seller Console
*   **Analytics Dashboard**: Visual charts for revenue trends, category sales, peak hours, and order volume.
*   **Multi-Variant Product CRUD**: Manage color and size options, complete with dedicated multi-image drag-and-drop Cloudinary uploads.
*   **Coupon Management**: Create, deactivate, and track coupon usages with minimum subtotal requirements.
*   **Order Fulfillment**: Live system to track payment states, ship orders, and update customer order history.

### ⚡ Technical Hardening & Performance
*   **LRU Caching Layer**: Integrated `lru-cache` on standard products and categories lists, safeguarding the application from V8 heap exhaustion and minimizing database pressure.
*   **Aggregation Pipelines**: Aggregated vendor metrics and user order histories using single-query MongoDB aggregations to eliminate legacy N+1 query loops.
*   **Compound Mongoose Indexes**: Standardized indexes on key search routes (`category`, `seller`, `slug`, `createdAt`) to optimize query speeds.
*   **Centralized Input Validation**: Zod middleware schemas guarding every API route (`auth`, `product`, `category`, `order`, `coupon`, `user`).
*   **Security Best Practices**: Helmet headers, CORS filters, and strict request rate limits on sensitive endpoints.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, Framer Motion, React Router 7, React Hook Form |
| **Backend** | Node.js, Express, MongoDB, Mongoose ORM, LRU Cache, Zod Validation |
| **Testing** | Node Test Runner, Supertest, Vitest |

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
*   Node.js 18+
*   MongoDB (Local Server or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & Install
```bash
git clone https://github.com/priyanshsinghpurawat/Ecommerce-Website.git
cd Ecommerce-Website

# Install backend dependencies
cd server
npm install --legacy-peer-deps

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Variables

**Backend (`server/.env`):**
Create a `.env` file from the example:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/e-commerce
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_EXPIRY=1d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Frontend (`client/.env`):**
Create a `.env` file in the client directory:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3. Seed Demo Data
Seeding inserts sample items, users, and coupons (`MENSVIBE10`, `FIT100`).
```bash
cd server
npm run seed
```

**Demo Credentials:**
*   **Admin**: `admin@mensvibe.in` / `adminpassword`
*   **Customer**: `demo@mensvibe.in` / `demopassword`

### 4. Run Locally
```bash
# Start backend API (Terminal 1)
cd server
npm run dev

# Start frontend (Terminal 2)
cd client
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Testing Suites

Run tests in the respective project directories:

| Tier | Coverage | Tool | Run Command |
|------|----------|------|-------------|
| **Backend** | API Endpoints, NoSQL Protection, Checkout Flows, Caching | Node Test Runner | `cd server && npm test` |
| **Frontend** | Utility functions, UI validations | Vitest | `cd client && npm test` |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.


✦ I have completed the UI restoration and data quality updates. Here is the summary of what's been fixed:

  ✅ Work Completed
   1. Navbar Restored: I moved the Admin Console link from the dropdown menu to a dedicated high-visibility button next to the user avatar (as it was in your preferred
      version).
   2. Genuine Seeder Data: I updated server/scripts/seeder.js with professional fashion studio photography from Unsplash. No more "lotion in clothing" — products like the
      "Essential White Oversized Tee" and "Urban Utility Cargo Pants" now have relevant, high-quality images.
   3. Variant Support: The seeder now includes product Variants (Size/Color) and SKUs, so the "Admin Console" and "Product Details" pages will have real data to display.
   4. Image Logic: Verified that the frontend correctly optimizes these high-quality images for fast loading.

  ---

  🛠️ Next Steps: Data Restoration & Deployment

  To get your website fully functional on the web, follow these steps to sync your local work with the cloud:

  1. Connect to MongoDB Atlas
  Your Render deployment failed because it couldn't find your local data. You need to point your server to the cloud.
   1. Open your server/.env file.
   2. Update the MONGODB_URI to your MongoDB Atlas connection string.
       * Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/mensvibe

  2. Run the New Seeder
  Once connected to Atlas, push the "genuine" data to the cloud by running this command in your server terminal:
   1 npm run seed
  Wait for the message: --- MensVibe seed complete ---

  3. Re-Deploy to Render
   1. Commit and Push these changes to your GitHub repo.
   2. In the Render Dashboard, create your services again:
       * Backend: Root: server, Build: npm install, Start: npm start. Add your Atlas MONGODB_URI and Cloudinary keys to the Environment Variables.
       * Frontend: Root: client, Build: npm run build, Publish: dist. Add VITE_API_URL pointing to your new Render backend.

  Would you like me to help you with the Render configuration settings or any specific UI adjustments before you push?
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
 > do it yourself and take accountablity
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

  Deployment Hardening & Accountability: Hardening the codebase for production and preparing deployment configurations.

  ✓  ReadFile  server\index.js
  ✓  ReadFile  server\app.js
  ✓  ReadFile  server\index.js
  ✓  ReadFile  client\src\services\api.js
  ✓  ReadFile  client\vite.config.js

