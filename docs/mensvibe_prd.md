# Product Requirements Document (PRD): MensVibe E-Commerce

## 1. Product Purpose
**MensVibe** is a high-performance, production-ready MERN stack e-commerce platform specializing in premium men's apparel and footwear. The platform is designed to provide a sleek, glassmorphic storefront for customers while offering a powerful multi-role administrative core for sellers and administrators to manage catalog, inventory, and sales.

## 2. Target Audience & User Roles
The platform caters to three primary user types, enforced by Role-Based Access Control (RBAC):

1. **Customers (Users):** Shoppers browsing the storefront, adding items to their cart/wishlist, applying discount coupons, and checking out securely.
2. **Sellers:** Vendor accounts that can manage their specific product catalog, track inventory depth, and view real-time revenue analytics for their products.
3. **Administrators (Admins):** Global managers who have overarching control over the entire platform, including all products, user accounts, platform analytics, coupons, and global settings.

## 3. Core Features & Functionality

### 3.1. Premium Storefront (Customer Facing)
- **Product Discovery:** 
  - Intelligent, multi-facet filtering allowing users to search by category (e.g., Clothing, Footwear), subcategory (e.g., Shirts, Sneakers), size, color, and price range.
  - Detailed product pages with high-resolution image galleries (powered by Cloudinary).
- **Shopping Cart & Wishlist:** 
  - Persistent cart and wishlist states across sessions.
  - Support for complex product variants (users must select specific colors and sizes before adding to cart).
- **Checkout & Payments:** 
  - Secure payment gateway integration (Razorpay).
  - Real-time pincode delivery verification to ensure serviceability before purchase.
  - Coupon engine allowing users to apply flat or percentage-based discounts during checkout.

### 3.2. Administrative Hub (Seller & Admin Facing)
- **Catalog Management:**
  - Advanced CRUD operations for managing complex product variants (multiple sizes, colors, and SKUs).
  - Automated image uploading and processing pipeline via Cloudinary.
  - CSV Bulk Import functionality for rapid catalog population.
- **Order & Inventory Tracking:**
  - Real-time tracking of order statuses.
  - Inventory depth tracking to prevent overselling of specific variants.
- **Marketing & Analytics:**
  - Integrated coupon engine with customizable discount rules (percentage/flat), usage limits, and first-time user restrictions.
  - Real-time revenue analytics and performance metrics separated by seller.

### 3.3. Security & Architecture
- **Authentication:** Secure JWT-based sessions, strict 8-character minimum password policies, and cryptographically secure password hashing.
- **Data Integrity:** Strict input validation using Zod schemas and sanitized NoSQL queries to prevent injection attacks.

## 4. Expected User Workflows (For Testing)

**Workflow A: Customer Purchase**
1. User registers/logs in to the storefront.
2. User filters products to find a specific variant (e.g., Size M, Blue Color).
3. User checks pincode serviceability on the product page.
4. User adds the item to the cart.
5. User navigates to checkout, applies a valid coupon code.
6. User completes the transaction via Razorpay mock payment.
7. System generates an Order ID and updates inventory stock.

**Workflow B: Seller Product Management**
1. Seller logs into the dashboard.
2. Seller creates a new product, uploading images and defining pricing.
3. Seller adds multiple variants (e.g., Small, Medium, Large) and assigns stock to each.
4. Product goes live on the storefront.
5. Seller views the analytics page to track stock depletion as orders come in.

## 5. Technical Stack Overview
- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Integrations:** Cloudinary (Media), Razorpay (Payments), Redis (Caching)
