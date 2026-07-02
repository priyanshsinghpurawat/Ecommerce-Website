<div align="center">
  <br />
  <p>
    <b>High-Performance MERN E-Commerce Platform</b>
  </p>
  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-blue.svg?style=for-the-badge&logo=react" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC.svg?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-green.svg?style=for-the-badge&logo=node.js" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-4-lightgrey.svg?style=for-the-badge&logo=express" alt="Express" /></a>
    <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg?style=for-the-badge&logo=mongodb" alt="MongoDB" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge" alt="License" /></a>
  </p>
</div>

---

**MensVibe** is a modern, production-ready e-commerce ecosystem built for scale. Specializing in premium men's apparel and footwear, it leverages a high-performance **MERN** stack architecture combined with a sleek, glassmorphic UI to deliver an unparalleled shopping experience. 

Designed for both consumers and vendors, MensVibe features a powerful multi-role administrative core, dynamic multi-vendor storefronts, and robust financial ledger tracking.

---


## 🏗️ System Architecture

Our platform is engineered for scalability, separating concerns cleanly across the frontend, backend API, and database layers.



### 🔄 Order & Payment Implementation Workflow
Here is an inside look at how secure transactions are processed through the Razorpay SDK and our MongoDB schemas:

```mermaid
sequenceDiagram
    participant U as User (Client)
    participant A as Express API (Server)
    participant R as Razorpay Gateway
    participant D as MongoDB

    U->>A: 1. POST /api/orders/checkout (Cart Data)
    A->>D: 2. Validate Stock & Prices
    A->>R: 3. Create Razorpay Order
    R-->>A: 4. Return Order ID (rp_order_xyz)
    A-->>U: 5. Return Order ID & Payment Options
    U->>R: 6. User Completes Payment in UI
    R-->>U: 7. Payment Success Signature
    U->>A: 8. POST /api/orders/verify
    A->>A: 9. Verify crypto.timingSafeEqual() signature
    A->>D: 10. Deduct Stock & Save Final Order
    A-->>U: 11. Payment Confirmed / Receipt
```

---

## ✨ Core Pillars

### 🛍️ Premium Storefront Experience
- **Fluid UX**: Modern UI with subtle neon accents (`#c1ff00`), Framer Motion micro-interactions, and a bespoke dark mode aesthetic (`#121212`).
- **Intelligent Catalog**: High-performance multi-facet filtering (category, size, color, price range).
- **Seamless Checkout**: Frictionless shopping cart securely integrated with **Razorpay**.

### 🔐 Hardened Security Architecture
- **Strict RBAC**: Role-Based Access Control enforcing granular permissions for Customers, Sellers (Vendors), and Admins.
- **Cryptographic Integrity**: Secure password generation, robust JWT session management, and `crypto.timingSafeEqual` signature verification.
- **Bulletproof APIs**: Zod schema-validated payloads and sanitized NoSQL execution paths.

### 📊 Seller Command Center
- **Multi-seller Ecosystem**: sellers manage their own storefronts (`/store/:brandName`) and curate catalogs.
- **Real-Time Logistics**: Sellers access dedicated dashboards to monitor incoming orders and track inventory depth.
- **Financial Ledger**: Automated tracking of seller revenues minus the platform commission fee.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Backend** | Node.js (>= 18), Express |
| **Database** | MongoDB (Atlas), Mongoose ODM (Advanced Aggregations & Indexing) |
| **Validation** | Zod (Schema Validation), Express-Validator |
| **Payments** | Razorpay Node.js SDK |
| **Testing** | Vitest, Supertest |


---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br/>
  <i>Built with passion for the modern web.</i>
</div>
