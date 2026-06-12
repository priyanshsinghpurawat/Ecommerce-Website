# Deployment Checklist — MensVibe

This checklist ensures your ecommerce platform is production-ready across both frontend and backend.

---

## ✅ Code & Configuration

- [x] **Server graceful shutdown** — Added SIGTERM/SIGINT handlers for cloud deployments
- [x] **Environment variables documented** — `.env.example` files present in both `server/` and `client/`
- [x] **Vite build optimized** — Terser minification and sourcemap disabled in production
- [x] **API baseURL uses env vars** — Client respects `VITE_API_URL` for flexible deployment
- [x] **Rate limiting enabled** — Auth endpoints protected with express-rate-limit
- [x] **Security headers set** — Helmet middleware configured with CORS policy
- [x] **CORS properly configured** — Dynamic origin validation based on `CORS_ORIGIN` env var
- [x] **Input validation centralized** — Zod middleware guards all API routes
- [x] **Error handling middleware** — Centralized error handler mounted last in Express

---

## 📋 Pre-Deployment Setup

### Backend (`server/`)
1. **Set environment variables in your hosting platform:**
   ```
   PORT=3000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/e-commerce
   JWT_SECRET=<generate with: openssl rand -base64 32>
   CORS_ORIGIN=https://your-frontend-domain.com
   CLOUDINARY_CLOUD_NAME=<your-cloud-name>
   CLOUDINARY_API_KEY=<your-api-key>
   CLOUDINARY_API_SECRET=<your-api-secret>
   RAZORPAY_KEY_ID=<your-key-id>
   RAZORPAY_KEY_SECRET=<your-key-secret>
   GOOGLE_CLIENT_ID=<your-google-client-id>
   ```

2. **Verify MongoDB Atlas:**
   - Cluster created and running
   - Database user created with strong password
   - IP Whitelist: Allow Render IPs or `0.0.0.0/0`
   - Connection string copied to `MONGODB_URI`

3. **Verify external services:**
   - Cloudinary account active with API keys
   - Razorpay account configured (test or live keys)
   - Google OAuth credentials created (for social login)

### Frontend (`client/`)
1. **Set environment variables in your hosting platform:**
   ```
   VITE_API_URL=https://your-api-domain.com/api/v1
   VITE_GOOGLE_CLIENT_ID=<same-as-backend>
   ```

2. **Build locally to verify:**
   ```bash
   cd client
   npm run build
   # Check that dist/ folder is created with no errors
   ```

---

## 🚀 Deployment Steps

### Option A: Render (Recommended)

**Backend Web Service:**
- Root Directory: `server`
- Build Command: `npm install --legacy-peer-deps && npm run seed` (optional: to populate demo data)
- Start Command: `npm start`
- Runtime: Node 18+

**Frontend Static Site:**
- Root Directory: `client`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

### Option B: Vercel

**Backend (Serverless):**
- Create a `server/vercel.json`:
  ```json
  {
    "version": 2,
    "builds": [{ "src": "index.js", "use": "@vercel/node" }],
    "routes": [{ "src": "/(.*)", "dest": "index.js" }]
  }
  ```
- Set environment variables in Vercel dashboard
- Deploy from GitHub

**Frontend (Static):**
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

---

## 🧪 Post-Deployment Verification

After deployment, verify:

1. **Backend API Health Check:**
   ```bash
   curl https://your-api-domain.com/api/v1/health
   # Expected: { "ok": true }
   ```

2. **Frontend Access:**
   - Open your frontend domain in browser
   - Verify navbar, products, and hero carousel load
   - Check browser console for errors (F12)

3. **API Integration:**
   - Attempt login with demo credentials
   - Verify JWT cookie is set (DevTools → Application → Cookies)
   - Check that API calls reach production backend (DevTools → Network)

4. **Database Connectivity:**
   - Products should load from MongoDB
   - No "500 Internal Server Error" responses
   - Check Render/Vercel logs for connection errors

5. **Image Uploads:**
   - Try uploading a product image as admin
   - Verify Cloudinary integration works
   - Images should display correctly

6. **Payment Sandbox:**
   - Complete a test checkout with Razorpay sandbox keys
   - Verify order is saved to MongoDB
   - Check order history in user dashboard

---

## 🔒 Security Best Practices

- [x] Never commit `.env` files — use platform env var management
- [x] Use HTTPS only in production
- [x] Rotate `JWT_SECRET` periodically
- [x] Enable rate limiting on auth endpoints (already configured)
- [x] Use strong MongoDB passwords
- [x] Restrict Cloudinary API keys to your domain
- [x] Monitor Render/Vercel logs for suspicious activity

---

## 📊 Performance Tuning

- **MongoDB Indexes:** Already configured on `category`, `seller`, `slug`, `createdAt`
- **LRU Cache:** Reduces database queries for products/categories
- **Vite Build:** Minified with esbuild, sourcemaps disabled
- **CORS:** Optimized to allow only configured origins

Consider monitoring:
- Database query times
- API response latency
- Frontend bundle size
- Image optimization via Cloudinary

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| `CORS blocked origin` | Update `CORS_ORIGIN` to include frontend domain |
| `401 Unauthorized` | Check `JWT_SECRET` is set and matches across deployments |
| `Cannot connect to MongoDB` | Verify connection string and IP whitelist in Atlas |
| `Images not loading` | Check Cloudinary credentials and API limits |
| `Payment gateway errors` | Verify Razorpay keys (test vs. live) and webhook setup |
| `Rate limit exceeded` | Increase limits in `app.js` or check for bot traffic |

---

## 📞 Support

For issues:
1. Check Render/Vercel logs: `Logs` tab in dashboard
2. Test locally with same `.env` variables
3. Review MongoDB Atlas metrics
4. Check Cloudinary upload logs
5. Verify external service dashboards (Razorpay, Google OAuth)

---

**Last Updated:** June 8, 2026  
**Version:** v1.0  
