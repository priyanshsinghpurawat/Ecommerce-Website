# 👕 MensVibe — High-Performance MERN E-Commerce

[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

**MensVibe** is a high-performance, production-ready MERN stack e-commerce platform specializing in premium men's apparel and footwear. Built for the modern web, it combines a sleek, glassmorphic storefront with a powerful multi-role administrative core.

---

## ✨ Core Pillars

### 🛍️ Premium Storefront
*   **Fluid UX**: Modern glassmorphism UI with real-time micro-interactions and high-resolution media handling.
*   **Intelligent Search**: Multi-facet filtering by category, size, color, and price range.
*   **Robust Checkout**: Integrated with Razorpay for secure payments and real-time pincode delivery verification.

### 🔐 Hardened Security
*   **RBAC (Role-Based Access Control)**: Granular permissions for Users, Sellers, and Admins.
*   **Cryptographic Integrity**: Secure password hashing, JWT-based sessions, and `crypto.timingSafeEqual` signature verification.
*   **Data Protection**: Zod-validated inputs, sanitized NoSQL queries, and strict CORS policies.

### 📊 Administrative Hub
*   **Seller Command Center**: Real-time analytics, inventory depth tracking, and revenue performance metrics.
*   **Catalog Management**: Advanced CRUD supporting complex product variants (colors/sizes) and automated Cloudinary image pipelines.
*   **Marketing Forge**: Integrated coupon engine with flexible discount rules and usage limits.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion |
| **Backend** | Node.js, Express, Redis (Caching), Multer (Uploads) |
| **Database** | MongoDB + Mongoose (Advanced Aggregations & Indexing) |
| **Validation** | Zod (Schema Validation), express-validator |
| **Testing** | Vitest, Supertest, Node.js Native Test Runner |

---

## 🚀 Quick Start

```
---

## 📂 Project Architecture

```text
├── client/              # React (Vite) Application
│   ├── src/app/         # Routing and Main Entry
│   ├── src/components/  # UI Library (Atomic Design)
│   ├── src/context/     # Auth, Cart, & Wishlist States
│   └── src/pages/       # View Declarations
└── server/              # Node.js REST API
    ├── config/          # System & Security Configs
    ├── controllers/     # Request Orchestrators
    ├── models/          # Data Schemas
    ├── middleware/      # Auth & Sanitization Interceptors
    └── routes/          # API Endpoint Definitions
```

---

## 📝 Recent Critical Updates (June 2026)
*   **Security**: Upgraded password generation to cryptographically secure `getRandomValues`.
*   **Validation**: Hardened MongoDB URI schemas and restored 8-character minimum password policy.
*   **Performance**: Implemented AbortControllers for external Pincode API fetches to prevent UI hangs.
*   **Accuracy**: Fortified revenue analytics logic to ensure strictly scoped commercial reporting.

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with passion for the modern gentleman.*
