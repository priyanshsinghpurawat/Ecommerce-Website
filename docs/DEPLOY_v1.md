# Deployment Guide (v1)

This guide covers deploying MensVibe to Render.

## Prerequisites
- A [Render](https://render.com) account.
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
- A [Cloudinary](https://cloudinary.com) account (for image uploads).
- A [Razorpay](https://razorpay.com) account (for payments).

## 1. MongoDB Atlas Setup
1. Create a cluster.
2. Create a database user.
3. Allow all IP addresses (0.0.0.0/0) or Render's outbound IPs.
4. Copy the connection string.

## 2. Backend Deployment (Render Web Service)
- **Repo:** Your GitHub repository.
- **Root Directory:** `server`
- **Build Command:** `npm install --legacy-peer-deps`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `MONGODB_URI`: Your Atlas connection string.
  - `JWT_SECRET`: A long random string.
  - `NODE_ENV`: `production`
  - `CORS_ORIGIN`: `https://your-frontend.onrender.com`
  - `CLOUDINARY_CLOUD_NAME`: ...
  - `CLOUDINARY_API_KEY`: ...
  - `CLOUDINARY_API_SECRET`: ...
  - `RAZORPAY_KEY_ID`: ...
  - `RAZORPAY_KEY_SECRET`: ...

## 3. Frontend Deployment (Render Static Site)
- **Repo:** Your GitHub repository.
- **Root Directory:** `client`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: `https://your-api.onrender.com/api/v1`

## 4. Post-Deployment
Once both services are up, run the seeder locally against your Atlas URI (by temporary setting `MONGODB_URI` in `server/.env`) to populate your production database.
