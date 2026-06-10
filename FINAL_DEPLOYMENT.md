# 🚀 MensVibe: Complete & Final Production Deployment Guide

This document is the single, unified source of truth for deploying the MensVibe e-commerce storefront. Follow these exact steps to deploy both the backend service and frontend static application to Render, backed by a MongoDB Atlas cloud database.

---

## 📋 Prerequisites

Ensure you have active accounts and credentials for the following services:
1. **[Render Account](https://render.com)**: For hosting the Node.js API (Web Service) and the React frontend (Static Site).
2. **[MongoDB Atlas Account](https://www.mongodb.com/atlas)**: For hosting the production database cluster.
3. **[Cloudinary Account](https://cloudinary.com)**: For hosting and serving high-quality product images.
4. **[Razorpay Account](https://razorpay.com)**: For processing secure credit card and UPI payments in INR.

---

## 🛠️ Step-by-Step Deployment Workflow

### Phase 1: MongoDB Atlas Setup
1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new **Shared Cluster** (free tier is sufficient).
3. Under **Database Access**, create a database user with read/write access. Write down the username and password.
4. Under **Network Access**, click **Add IP Address** and add `0.0.0.0/0` (allows connections from Render's dynamic IPs).
5. Go back to **Database**, click **Connect** -> **Drivers**, and copy the connection string.
   - *It will look like:* `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/mensvibe?retryWrites=true&w=majority`
   - *Note:* Replace `<username>` and `<password>` with the database user details created in Step 3.

---

### Phase 2: Database Seeding (Local to Cloud)
Before deploying the server to Render, seed your remote database with professional studio photography and proper product variants (sizes and colors):
1. Open `server/.env` on your local system.
2. Temporarily set the `MONGODB_URI` value to your **MongoDB Atlas connection string**.
3. Open a terminal in the project root and seed the database:
   ```bash
   cd server
   npm run seed
   ```
4. Verify the success message: `--- MensVibe seed complete ---`.
5. **CRITICAL SECURITY STEP:** Revert the `MONGODB_URI` in your local `server/.env` back to your local database string (`mongodb://localhost:27017/mensvibe`) to prevent accidental local modifications to your production database.

---

### Phase 3: Deploy Backend Service (Render Web Service)
1. Log in to **Render** and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following service settings:
   - **Name:** `mensvibe-backend` (or a custom name)
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add the following **Environment Variables** under the **Environment** tab:

| Variable | Recommended Value / Description |
| :--- | :--- |
| `PORT` | `3000` *(Or leave blank; Render will auto-assign a port)* |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | *Your MongoDB Atlas connection string (from Phase 1)* |
| `JWT_SECRET` | *A long, secure random string (e.g., generated with `openssl rand -hex 32`)* |
| `JWT_EXPIRY` | `7d` |
| `CORS_ORIGIN` | `https://your-frontend-name.onrender.com` *(The URL of your deployed frontend)* |
| `USE_LOCAL_STORAGE` | `false` *(Enables Cloudinary hosting for images)* |
| `CLOUDINARY_CLOUD_NAME`| *Your Cloudinary cloud name* |
| `CLOUDINARY_API_KEY` | *Your Cloudinary API key* |
| `CLOUDINARY_API_SECRET`| *Your Cloudinary API secret* |
| `RAZORPAY_KEY_ID` | *Your Razorpay Key ID (test or live)* |
| `RAZORPAY_KEY_SECRET` | *Your Razorpay Key Secret* |

5. Click **Deploy Web Service** and wait for the build to complete. 
6. Once deployed, note down the backend service URL (e.g., `https://mensvibe-backend.onrender.com`).

---

### Phase 4: Deploy Frontend Service (Render Static Site)
1. Click **New +** -> **Static Site** on the Render dashboard.
2. Connect your GitHub repository.
3. Configure the following site settings:
   - **Name:** `mensvibe-frontend`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. Under **Environment**, add the following environment variable:

| Variable | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://your-backend-name.onrender.com/api/v1` *(The Render URL from Phase 3 followed by `/api/v1`)* |

5. Click **Deploy Static Site**.
6. Once completed, your app will be live at the provided static site URL!

---

### Phase 5: Post-Deployment Verification
- **Backend Health Check:** Open a browser tab to `https://your-backend-name.onrender.com/api/v1/health`. It should return `{"ok": true}` instantly.
- **Frontend Check:** Visit the frontend URL. Ensure products render properly (proving connection to MongoDB Atlas and image resolution via Cloudinary), and verify that login, register, and shopping cart operations execute successfully.

---

## 🌟 Features Deployed & Verified
1. **High-Visibility Navbar:** Separate, quick-access "Admin Console" button for administrators.
2. **Rich Seeder Catalog:** Real streetwear studio photography catalog including full variant options (Sizes and Colors).
3. **Hardened API Gateways:** Configured with global request sanitization (NoSQL injection prevention) and rate limiters for auth endpoints.
4. **Clean CORS Policies:** Custom origin verification matching production frontend client endpoints.
