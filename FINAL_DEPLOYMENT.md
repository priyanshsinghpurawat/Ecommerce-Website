# 🚀 MensVibe: Final Deployment Guide

I have fixed the UI regressions (Navbar & Admin Console) and updated the seeder with high-quality fashion imagery. Follow these exact steps to get your site live on Render with "genuine" data.

## 1. Prepare your MongoDB Atlas
1.  Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Go to **Network Access** and ensure your IP (or `0.0.0.0/0`) is allowed.
3.  Go to **Database**, click **Connect** -> **Drivers**, and copy the connection string.
    *   *It should look like:* `mongodb+srv://username:password@cluster0.abcde.mongodb.net/mensvibe?retryWrites=true&w=majority`

## 2. Sync Local Code with Atlas
Open your terminal in the project root and run:

```bash
# 1. Open server/.env and paste your Atlas URI into MONGODB_URI
# 2. Run the seeder to push "genuine" data to the cloud
cd server
npm run seed
```
*Wait for: `--- MensVibe seed complete ---`*

## 3. Deploy to Render (The Accountability Check)

### A. Backend Service (Web Service)
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `MONGODB_URI`: (Your Atlas URI)
  - `NODE_ENV`: `production`
  - `JWT_SECRET`: (Any long random string)
  - `CORS_ORIGIN`: `https://your-frontend-name.onrender.com`
  - `CLOUDINARY_CLOUD_NAME`: (From your Cloudinary dashboard)
  - `CLOUDINARY_API_KEY`: (From your Cloudinary dashboard)
  - `CLOUDINARY_API_SECRET`: (From your Cloudinary dashboard)

### B. Frontend Service (Static Site)
- **Root Directory:** `client`
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variables:**
  - `VITE_API_URL`: `https://your-backend-name.onrender.com/api/v1`

## ✅ What's been fixed:
1.  **Navbar:** Admin Console is now a separate, high-visibility button.
2.  **Seeder:** Replaced placeholder images with professional studio photography.
3.  **Variants:** The seeder now includes Sizes and Colors for products.
4.  **Security:** Hardened CORS and environment variable handling for production.

**Everything is ready. Just point your `.env` to Atlas and run the seed command!**
