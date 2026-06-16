# MensVibe — MERN E-Commerce Platform

[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

MensVibe is a production-ready MERN stack e-commerce platform specializing in men's apparel and footwear. Designed with high-performance standards, it features a modern storefront interface, a comprehensive seller/admin console, automated inventory tracking, promotional coupon logic, centralized Zod validation, and a resilient Redis/LRU caching architecture.


---

## Key Features

### Storefront & User Interface
* **Dynamic Search & Filtering:** Facilitates real-time catalog search and multi-facet filtering (categories, subcategories, price ranges).
* **Guarded Forms:** Robust customer login and registration powered by `react-hook-form` and `zod`, featuring real-time CapsLock detection and a password strength meter.
* **Premium UX:** Modern dark-mode accents, glassmorphic overlays, and fluid micro-animations utilizing Framer Motion.

### Admin & Seller Administration
* **Analytical Dashboards:** Visualizations tracking revenue trends, category breakdown, checkout analytics, and peak order hours.
* **Multi-Variant CRUD:** Manage product options (color, size, stock) integrated with multi-image Cloudinary upload utilities.
* **Coupon & Order Pipelines:** Administrative dashboard to control coupon activation rules and track customer order fulfillment statuses.

### Security & Optimization
* **Hybrid Caching:** High-speed Redis layer with process-bound local LRU cache fallback to reduce database load.
* **Performance Querying:** Compound indexing on Mongo collections and clean aggregation pipelines to prevent N+1 query patterns.
* **Hardened Infrastructure:** Strict request rate-limiting, CORS origin validations, Helmet HTTP header security, and NoSQL parameter sanitization.

---

## Technical Specifications

| Layer | Component | Core Technologies |
| :--- | :--- | :--- |
| **Client** | Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, React Router 7 |
| **Server** | Backend | Node.js, Express, MongoDB (Mongoose ORM), Redis, Zod, Multer |
| **QA** | Testing | Node.js Test Runner, Supertest, Vitest |

---

## License

Distributed under the MIT License.
