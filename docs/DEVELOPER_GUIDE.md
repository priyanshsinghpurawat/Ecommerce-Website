# MensVibe Developer Guide

Welcome to the MensVibe codebase. This guide explains the project architecture, tech stack, and common workflows.

## Architecture Overview

MensVibe is a classic MERN stack application:

- **Frontend (`/client`)**: React 19 application built with Vite. Uses Tailwind CSS 4 for styling and Framer Motion for animations.
- **Backend (`/server`)**: Node.js Express API. Uses Mongoose for MongoDB modeling and JWT for authentication.

### Data Flow

1. User interacts with the React frontend.
2. Frontend calls services in `client/src/services/` using an Axios instance configured in `api.js`.
3. Backend receives requests in `server/routes/`, which are handled by `server/controllers/`.
4. Controllers interact with `server/models/` to perform database operations.
5. Responses are returned using a standardized `ApiResponse` utility.

## Key Features Implementation

### Authentication
- Uses JWT (JSON Web Tokens) stored in `localStorage`.
- `AuthContext.jsx` manages global user state and provides `loginUser`, `registerUser`, and `logoutUser` functions.
- `auth.middleware.js` on the backend verifies tokens for protected routes.

### Shopping Cart
- Persisted in MongoDB for logged-in users.
- `CartContext.jsx` synchronizes local state with the backend.

### Vendor Management (New May 2026)
- **Multi-Vendor Schema:** The `User` model now includes `brandName` and `isActive` for users with the `seller` role.
- **Admin Oversight:** Admins can manage the vendor ecosystem via `/admin/vendors`, allowing for merchant suspension and performance analysis.
- **Data Aggregation:** Vendor profiles use complex MongoDB aggregations (via `user.controller.js`) to calculate real-time revenue and active order counts by filtering global orders for specific vendor product IDs.

### Wishlist
- Added as a persistent feature in `User` model.
- Managed via `WishlistContext.jsx` and `WishlistProvider`.

### Payments (Razorpay)
- Integrated via `payment.controller.js` on the backend and `Cart.jsx` on the frontend.
- Uses `razorpay` Node.js SDK to create orders and verify signatures.

## Styling & Theme

### Acid & Obsidian Gen-Z Theme
- Defined in `client/src/index.css` using Tailwind CSS 4 `@theme` block.
- Primary colors: `brand-primary` (#c1ff00) and `app-bg` (#121212).
- Font: 'League Spartan'.

## Development Workflows

### Seeder & Sample Vendors
Run `npm run seed` to populate the DB. The seeder now creates multiple distinct vendor entities (e.g., *MensVibe Originals*, *Nike Authorized*) to test the multi-vendor partitioning logic.

### Adding a New Route
1. Create the page component in `client/src/pages/`.
2. Add the route to `client/src/app/App.jsx`.
3. (If protected) Wrap it with `<ProtectedRoute>`.

### Backend Testing
Run `npm test` in the `server` directory. Tests use `supertest` and an in-memory MongoDB server.

## Maintenance & Cleanup

To keep the codebase clean and efficient, follow these guidelines for removing unwanted files and folders:

### Unused Assets
- Check `client/public/assets/` for images or fonts that are no longer referenced in the code.
- Periodically audit the `client/src/assets` folder for unused local components or styles.

### Build Artifacts
- The `client/dist` and `server/node_modules` folders are generated and should not be committed.
- If you encounter build issues, safely delete `node_modules` and the lock file (`package-lock.json` or `bun.lock`), then run `npm install`.

### Temporary Files
- Remove any `.tmp`, `.log`, or `.env.local` files that are not part of the standard configuration.
- Clean up any manual database backups or CSV export files stored outside the `docs/` folder.

### Database Cleanup
- Use `npm run seed` to reset the database to a clean state with sample data.
- To wipe everything, use the `server/scripts/test_db.js` utility or manually clear collections via MongoDB Atlas/Compass.
