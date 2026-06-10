# MensVibe v2 — Master Prompt Blueprint
> **Problem with v1:** Looked like a side project. Goal: match The Souled Store / Powerlook visual bar — Gen-Z dark mode, acid green, brutal typography, mobile-first, production-grade.

---

## What v1 Got Wrong (Honest Audit)

| Issue | Root Cause |
|---|---|
| Feels 5 years old | Generic card layout, no editorial identity |
| Color palette is bland | Gold (#c9a227) doesn't read "Gen-Z streetwear" |
| No visual hierarchy | Missing oversized type, bold section breaks |
| Product grid feels basic | No hover state video, no lifestyle-shot thinking |
| Mobile feels like desktop-shrunk | No bottom nav, no swipe-first interactions |
| Admin ≠ professional dashboard | Bare table with no data density or polish |

---

## Design Direction (Inspiration: Souled Store + Powerlook)

### What those sites do right
- **Sticky "Add to Cart" bar** — visible while scrolling product page
- **"Only 3 left" urgency copy** — per-size stock scarcity
- **Lifestyle + studio images** — not just white-bg product shots
- **Bold collection drops** — full-bleed editorial banners, not carousels
- **Filter sheet on mobile** — bottom drawer, not sidebar collapse
- **Trusted by X customers badge** — social proof in header or footer
- **Size guide modal** — built into product page
- **Seamless Instagram-to-PDP** — fast load, no flash of unstyled content

### Gen-Z Acid Design System
```
Background:      #050505  (near-pure black)
Surface:         #0f0f0f  (card bg)
Surface-raised:  #1a1a1a  (hover, modal bg)
Accent:          #b5f23a  (acid lime-green — main CTA)
Accent-dim:      #8dc42a  (pressed state)
Text-primary:    #f0f0f0
Text-secondary:  #888888
Border:          #1e1e1e
Danger:          #ff3c3c
Success:         #b5f23a  (same as accent)

Typography:
  Headings → Space Grotesk (700–900 weight, tight tracking)
  Body      → Inter (400–500)
  Mono/Tags → JetBrains Mono (sizes, SKUs, codes)

Design language:
  - Hard drop shadows in accent color: box-shadow: 4px 4px 0 #b5f23a
  - Thin 1px acid-green borders on focus/hover
  - Zero border-radius on hero elements (brutal), 4px on cards
  - Uppercase section labels with letter-spacing: 0.15em
  - Oversized hero numbers and statistics
  - Noise/grain texture overlay on hero sections (CSS)
```

---

## THE MASTER PROMPT

> Paste this into a fresh AI session. It is self-contained — no follow-up needed.

---

```
You are building "MensVibe" — a production-quality MERN e-commerce platform for men's
streetwear and footwear. The visual target is The Souled Store + Powerlook quality,
NOT a tutorial project. Every design and code decision must reflect this.

=============================================================================
STACK
=============================================================================
Backend : Node.js 20, Express 4, MongoDB + Mongoose 8, JWT, Zod validation,
          Multer (memoryStorage), Cloudinary v2, lru-cache 10, Helmet, CORS,
          express-rate-limit, Morgan

Frontend: React 19, Vite 5, Tailwind CSS 4, React Router 7, Framer Motion 11,
          React Hook Form 7 + @hookform/resolvers/zod, Axios, Recharts,
          react-hot-toast, react-dropzone, react-zoom-pan-pinch

Monorepo: /client (Vite app) + /server (Express API)

=============================================================================
DESIGN SYSTEM — THIS IS NON-NEGOTIABLE
=============================================================================
Build a global CSS/Tailwind theme using these exact tokens:

  Background:   #050505
  Surface:      #0f0f0f
  Surface+:     #1a1a1a
  Accent:       #b5f23a  ← acid lime-green, used for ALL CTAs
  Accent-dim:   #8dc42a
  Text:         #f0f0f0
  Muted:        #888888
  Border:       #1e1e1e
  Danger:       #ff3c3c

Fonts (load from Google Fonts in index.html):
  Space Grotesk 700,900 — all headings
  Inter 400,500 — all body text
  JetBrains Mono 400 — sizes, SKUs, coupon codes, price tags

Rules every component must follow:
  1. Product cards: 0 border-radius on image, 4px on wrapper, acid-green
     box-shadow on hover (4px 4px 0 #b5f23a), transition 120ms
  2. Buttons (primary): bg #b5f23a, text #050505, font-weight 700,
     UPPERCASE, letter-spacing 0.1em, 0 border-radius. On hover: translate(-2px,-2px)
     with shadow 4px 4px 0 #fff
  3. Buttons (ghost): transparent bg, 1px solid #b5f23a, text #b5f23a
  4. Section headings: Space Grotesk 900, 56px+ on desktop, uppercase,
     tight tracking. NEVER center-align body section headings
  5. All badges ("SALE", "NEW", sizes, tags): JetBrains Mono, uppercase,
     no border-radius, tight padding
  6. Mobile bottom navigation bar — always visible on <768px:
     Home | Shop | Cart (badge) | Profile
  7. Noise/grain texture on hero: pseudo-element with
     background: url("data:image/svg+xml,...") repeat, opacity: 0.04
  8. Page transitions: Framer Motion opacity 0→1 + y 12→0, duration 0.25s

=============================================================================
DATABASE MODELS
=============================================================================
User    : name, email, password(bcrypt,12), role(customer|admin),
          wishlist[ProductRef], addresses[{label,street,city,state,pin}]

Product : name, slug(unique,indexed), description, price, comparePrice,
          category(ref,indexed), subcategory(ref), seller(ref,indexed),
          images[String(Cloudinary URL)],
          variants[{color,colorHex,size,stock,sku,images[String]}],
          tags[String], isFeatured, badge(enum:NEW|SALE|TRENDING|null),
          ratings{average,count}, soldCount

Category     : name, slug(unique), image(String), description
Subcategory  : name, slug(unique), parent(ref→Category)

Cart  : user(unique), items[{product,variantId,qty,price,snapshot{name,image}}],
        totalAmount

Order : user, items[{product,name,qty,price,variant{color,size},image}],
        shippingAddress, paymentStatus(pending|paid|failed),
        orderStatus(processing|shipped|delivered|cancelled),
        statusHistory[{status,timestamp,note}],
        couponCode, subtotal, discount, deliveryFee, total, razorpayOrderId

Coupon: code(unique,uppercase), discountType(percent|flat), discountValue,
        minOrderAmount, expiresAt, isActive, usageCount, maxUsage, usedBy[UserRef]

=============================================================================
BACKEND API  (all routes prefixed /api/v1)
=============================================================================
AUTH        POST /auth/register, /auth/login, /auth/logout  GET /auth/me
PRODUCTS    GET / (LRU cached, filter: category,sub,size,color,minP,maxP,sort,q,page)
            GET /:slug   POST / PUT /:id DELETE /:id  (POST/PUT/DELETE → admin)
CATEGORIES  GET /   GET /:slug/products   POST PUT DELETE (admin)
CART        GET /   POST /add   PUT /update   DELETE /remove/:id   DELETE /clear
ORDERS      POST /   GET /my   GET /:id   GET / (admin)   PATCH /:id/status (admin)
COUPONS     POST /validate   GET / POST PATCH /:id/deactivate (admin)
UPLOAD      POST /upload/image (multer memoryStorage → cloudinary.uploader.upload_stream)
ANALYTICS   GET /analytics/summary /revenue /top-products /category-breakdown /peak-hours
WISHLIST    GET /wishlist  POST /wishlist/:productId  DELETE /wishlist/:productId

Middleware pipeline: morgan → cors → helmet → rateLimit → express.json
                     → isAuthenticated → isAdmin → zodValidate → controller
Rate limits: 100/15min global · 10/15min on /auth · 20/min on /upload

=============================================================================
FRONTEND PAGES  (React.lazy + Suspense on every route)
=============================================================================

── PUBLIC ──────────────────────────────────────────────────────────────────

HOME  /
  • Full-bleed hero: 100vh, background-attachment fixed, grainy texture overlay,
    massive Space Grotesk headline, acid-green CTA "SHOP NOW"
  • Ticker/marquee strip: "FREE DELIVERY ABOVE ₹999 · NEW DROP EVERY FRIDAY · USE CODE MENSVIBE10"
  • "New Drops" horizontal scroll rail: scroll-snap, product cards with NEW badge
  • Category grid: 2-col on mobile, 4-col desktop, full-bleed image tiles
    with overlaid uppercase label and hover zoom
  • "Trending Now" grid — 3 featured products with large lifestyle images
  • Trust bar: icons + "30-Day Returns · Secure Checkout · COD Available · 50K+ Happy Customers"
  • Footer: minimal, dark, 4-col links, social icons, newsletter input

SHOP  /shop
  • Mobile: filter button opens bottom-sheet drawer (Framer Motion slide-up)
  • Desktop: 260px sticky sidebar with:
      - Category tree checkboxes
      - Price range dual-handle slider
      - Size grid (S M L XL XXL) — toggle buttons, not checkboxes
      - Color swatches (filled circles)
      - Sort dropdown (Newest · Price ↑ · Price ↓ · Best Selling)
  • Product grid: 2-col mobile, 3-col desktop
  • ProductCard:
      - Image fills card; on hover show second image (if exists)
      - Quickadd size pills appear on hover (desktop)
      - Wishlist heart top-right corner
      - Name, price, comparePrice (strikethrough), badge pill
      - "Only 2 left" warning when stock < 3
  • Skeleton loader (pulse animation) while fetching
  • Infinite scroll OR numbered pagination

PRODUCT DETAIL  /product/:slug
  • Left: image gallery — main image with react-zoom-pan-pinch, thumbnail rail below
  • Right panel:
      - Badge pill + name (Space Grotesk 700) + rating stars + review count
      - Price with comparePrice strikethrough + discount percent badge
      - "Only X left" urgency line (per selected size)
      - Color selector: swatch circles, acid-green ring on selected
      - Size selector: pill grid, disabled state for OOS, "Size Guide" link opens modal
      - Qty stepper + sticky "ADD TO BAG" button (acid-green, full-width)
      - Wishlist button below CTA
      - Delivery estimator: pincode input → "Delivered by [date]"
      - Accordion: Product Details · Size & Fit · Care Instructions · Shipping Policy
  • Sticky bottom bar on mobile: size quick-pick + "ADD TO BAG"
  • "Complete the Look" / related products horizontal rail at bottom

CART  /cart
  • Left: CartItem rows — thumbnail, name, variant, qty stepper, remove
  • Right: Order Summary card (sticky on desktop)
      - Subtotal, delivery fee (free above ₹999), coupon discount, total
      - Coupon input: JetBrains Mono, validate on blur, acid-green success tick
      - "PROCEED TO CHECKOUT" button → create order → redirect to success page
  • Empty cart: large illustration + "Your bag is empty" + Shop CTA

AUTH  /login  /register
  • Centered card on dark textured bg
  • react-hook-form + zod validation — inline errors below fields
  • Password: strength meter bar (4 segments, color shifts green as strength increases)
  • CapsLock warning banner
  • Show/hide password toggle icon
  • "Remember my email" localStorage checkbox

ORDERS  /orders  /orders/:id
  • Orders list: card per order — order id, date, status badge, total, thumbnail strip
  • Order detail: status timeline stepper (vertical), item list, address, price breakdown

PROFILE  /profile
  • Tabs: Account Info · Addresses · Orders · Wishlist
  • Address book: add/edit/delete delivery addresses
  • Wishlist tab: grid of saved products (same ProductCard)

WISHLIST  /wishlist  (or redirect to /profile?tab=wishlist)

NOT FOUND  *  — branded 404 with animated glitch text effect

── ADMIN (role guard, /admin/*) ────────────────────────────────────────────

AdminLayout: fixed left sidebar (240px), collapsible on mobile, acid-green active indicator

DASHBOARD  /admin
  • Stat cards (4): Total Revenue · Orders Today · Active Products · Total Users
  • Recharts LineChart: last 30 days revenue (area chart, acid-green fill)
  • Recharts PieChart: revenue by category
  • Recharts BarChart: orders by hour (peak hour analysis)
  • "Recent Orders" table: last 10 orders, status badge, quick action

PRODUCTS  /admin/products
  • Searchable, sortable data table with pagination
  • Bulk delete checkbox select
  • "ADD PRODUCT" button → opens ProductForm in right-side drawer (not full page)

ProductForm (drawer/modal):
  • Fields: name (auto-generate slug), description, price, comparePrice, category,
    subcategory, badge, isFeatured toggle
  • Variant builder: "Add Variant" → row of {color name, hex picker, size, stock, SKU}
    can add multiple rows
  • Image upload: react-dropzone per variant, preview thumbnails,
    on drop → POST /api/v1/upload/image → store returned Cloudinary URL
  • Validation: zod on all fields, inline errors

ORDERS  /admin/orders
  • Table: order id, customer, items count, total, payment status, fulfillment status, date
  • Click row → detail drawer: full order info + status update dropdown + save button
  • Filter tabs: All · Pending · Processing · Shipped · Delivered · Cancelled

COUPONS  /admin/coupons
  • Form: code, type (percent|flat), value, minAmount, expiry, maxUsage
  • Table: code, type, value, usage/max, expiry, active toggle (switch)

CATEGORIES  /admin/categories
  • Two-panel: left = category list, right = subcategory list for selected
  • Inline add/edit/delete for both panels

=============================================================================
CORE COMPONENTS
=============================================================================
Navbar
  - Logo left · Search bar center (expands on focus) · Icons right: wishlist, cart (badge), account
  - On mobile: hamburger opens full-screen slide-in menu
  - Sticky top-0 with blur backdrop: backdrop-filter: blur(12px)
  - Admin console link visible only when user.role === 'admin'
  
ProductCard         — see SHOP section for full spec
FilterSidebar       — desktop sticky panel
FilterDrawer        — mobile bottom-sheet version (Framer Motion)
StickyAddToCart     — mobile sticky bar on product page
SizeGuideModal      — standard measurement table in modal
ImageGallery        — main + thumbnails + zoom
VariantSelector     — color swatches + size grid
CouponInput         — JetBrains Mono, live validation
OrderStatusBadge    — color-coded pill
OrderTimeline       — vertical stepper
SkeletonLoader      — pulse animation matching card dimensions
ProtectedRoute      — redirect to /login if no auth token
AdminLayout         — sidebar + outlet
Toast               — react-hot-toast, dark theme, acid-green success
ConfirmModal        — "Are you sure?" overlay

=============================================================================
PERFORMANCE
=============================================================================
- React.lazy() + Suspense fallback={<SkeletonLoader/>} on ALL page-level routes
- LRU cache: products (max=200, ttl=5min), categories (max=50, ttl=30min)
- MongoDB indexes: products{category,createdAt}, unique{slug}, {seller}, {isFeatured}
- Aggregation pipelines for all analytics — zero N+1 queries
- Cloudinary URL transforms: /f_auto,q_auto,w_600/ for cards, /w_1200/ for hero
- Vite manualChunks: vendor | framer-motion | recharts | react-router
- Gzip compression middleware on Express

=============================================================================
SECURITY
=============================================================================
- JWT in Authorization: Bearer header, 1d expiry
- bcrypt saltRounds=12
- Zod schema validation on every POST/PUT/PATCH route
- Helmet (all defaults), CORS whitelist from CORS_ORIGIN env
- express-rate-limit: 100/15min global, 10/15min auth, 20/min upload
- Admin double-guard: isAuthenticated + isAdmin on every /admin route
- Sanitize MongoDB query params (prevent NoSQL injection via Zod coerce)

=============================================================================
SEEDER  (server/scripts/seeder.js)
=============================================================================
Run with: npm run seed

Seeds:
  - 2 categories: Clothing, Footwear
  - 6 subcategories: Oversized Tees, Shirts, Cargo Pants, Sneakers, Slides, Boots
  - 24 products (4 per subcategory) with:
      - Unsplash image URLs (real fashion photography, not lotion bottles)
      - 2-3 color variants each with sizes S/M/L/XL and realistic stock numbers
      - Some with badge NEW, TRENDING, or SALE
      - soldCount between 10–500 to power "Best Selling" sort
  - 1 admin user: admin@mensvibe.in / adminpassword
  - 1 customer: demo@mensvibe.in / demopassword
  - 2 coupons: MENSVIBE10 (10% off, min ₹499) · FLAT150 (₹150 off, min ₹999)

=============================================================================
ENV FILES
=============================================================================
server/.env.example:
  PORT=3000
  NODE_ENV=development
  MONGODB_URI=mongodb://127.0.0.1:27017/mensvibe
  CORS_ORIGIN=http://localhost:5173
  JWT_SECRET=replace_this
  JWT_EXPIRY=1d
  CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=

client/.env.example:
  VITE_API_URL=http://localhost:3000/api/v1

=============================================================================
DEPLOYMENT
=============================================================================
Backend  → Render (root: server | build: npm install | start: npm start)
Frontend → Vercel (root: client | build: npm run build | publish: dist)
Database → MongoDB Atlas M0
Media    → Cloudinary free tier

=============================================================================
DELIVERY REQUIREMENT
=============================================================================
Generate every file completely. Zero placeholders. Zero "// TODO" comments.
The ONLY accepted output is working code that runs with:

  cd server && npm install && npm run seed && npm run dev
  cd client && npm install && npm run dev

If a feature can't be completed perfectly, implement a clean empty state —
never a broken or half-implemented component.
```

---

## Checklist — What v2 Adds Over v1

| Feature | v1 | v2 |
|---|---|---|
| Acid-green design system | ❌ Gold | ✅ #b5f23a |
| Space Grotesk typography | ❌ | ✅ |
| Mobile bottom nav | ❌ | ✅ |
| Sticky "Add to Bag" bar (mobile) | ❌ | ✅ |
| Filter bottom-sheet on mobile | ❌ | ✅ |
| Size guide modal | ❌ | ✅ |
| "Only X left" urgency copy | ❌ | ✅ |
| Quickadd on product card hover | ❌ | ✅ |
| Pincode delivery estimator | ❌ | ✅ |
| Wishlist API + page | partial | ✅ Full |
| Address book in profile | ❌ | ✅ |
| Order status history timeline | ❌ | ✅ |
| Admin drawer (not full page) | ❌ | ✅ |
| Sold count for bestseller sort | ❌ | ✅ |
| Product badge system (NEW/SALE) | ❌ | ✅ |
| Page-level skeleton loaders | partial | ✅ |
| LRU cache TTLs documented | ❌ | ✅ |
| NoSQL injection guard | ❌ | ✅ |

---

*MensVibe v2 — Master Plan Updated: 2026-06-09*

---

## 🚀 Today's Action Plan

**Completed Fixes (Performance & Bug Fixes):**
- ✅ Resolved `ShoppingBag` import error in `Shop.jsx`.
- ✅ Eliminated Frontend N+1 Query Waterfall by aggregating `Subcategory` images natively on the backend (`subcategory.controller.js`).
- ✅ Implemented dynamic image compression across the app via Cloudinary URL auto-formatting (`q_auto, f_auto, c_limit`), dropping image sizes by 80%+.
- ✅ Fixed `ProductDetails.jsx` React hook order violation crash (moved `useEffect` before early returns).
- ✅ Handled missing products gracefully in `ProductDetails.jsx` by showing a "Product Not Found" screen instead of a perpetual spinner.
- ✅ Corrected `StreetDrip.jsx` hotspots query titles to fetch products existing in the database, and prioritized dynamic ID links over old hardcoded IDs.

**Upcoming Feature Implementations:**
1. **"Shop the Look" Bundles:** 
   - Add bundle logic to group related products (e.g., "Neon Stitch Vest" + "Cargo Pants") together with a unified add-to-cart functionality.
2. **Interactive Sales Analytics:** 
   - Enhance the Admin Dashboard with deeper charts for revenue, popular categories, and peak hour analysis.
3. **PWA Integration (Progressive Web App):** 
   - Add a Web App Manifest and Service Worker to allow users to install the storefront as a standalone app on their mobile devices.
4. **Customer Reviews & Photo Uploads:** 
   - Upgrade the review system to allow customers to submit their fit check photos along with their ratings.
5. **Advanced Product Filtering:** 
   - Refine category and filter sync on the storefront, adding dynamic variant mapping.
