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
*   **Aesthetic UI**: Curated luxury dark-mode accents, glassmorphic card overlays, fluid micro-animations (Framer Motion), and responsive layout transitions.

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
