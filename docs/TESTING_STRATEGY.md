# MensVibe — Testing & Security Strategy

This document outlines the API testing checklist, security audit, missing validations, and edge cases for the MensVibe e-commerce platform.

## 1. API Testing Checklist

### Auth Module
- [ ] **Register**: Verify new user creation with valid data.
- [ ] **Register (Duplicates)**: Ensure duplicate email returns 409 Conflict.
- [ ] **Login**: Verify JWT issuance and cookie setting.
- [ ] **Google Login**: Verify social auth flow and user synchronization.
- [ ] **Logout**: Confirm cookie clearing.
- [ ] **Me**: Retrieve authenticated user profile.

### Product Module
- [ ] **Create (Admin)**: Multi-part upload for images + JSON data.
- [ ] **Read All**: Test pagination, search (`?search=`), and filters (category, price range).
- [ ] **Read One**: Fetch product by ID (valid vs invalid).
- [ ] **Update**: Modify stock, price, and descriptions.
- [ ] **Delete**: Ensure only admins can delete products.

### Category & Subcategory
- [ ] **CRUD**: Verify full cycle for categories and their linked subcategories.
- [ ] **Slugs**: Ensure slugs are auto-generated and unique.

### Cart Module
- [ ] **Add**: Add items to cart (check stock limits).
- [ ] **Update**: Increment/decrement quantity.
- [ ] **Remove**: Delete specific item.
- [ ] **Clear**: Empty the entire cart.

### Order Module
- [ ] **Checkout**: Place order from cart items.
- [ ] **Stock Locking**: Ensure stock is decremented atomically.
- [ ] **History**: User can see their own orders.
- [ ] **Admin View**: Admin can see all orders and update status.
- [ ] **Analytics**: Verify revenue and category performance aggregation.

### Coupon Module
- [ ] **Application**: Validate coupon code against cart subtotal.
- [ ] **Restrictions**: Min amount, expiry, and product-specific limits.
- [ ] **Usage Count**: Ensure `usageCount` increments only on successful order.

### Payment Module
- [ ] **Razorpay**: Create order ID on backend.
- [ ] **Verification**: Verify signature from Razorpay webhook/callback.

---

## 2. Security Checklist

- [ ] **Rate Limiting**: Apply to `/api/v1/auth/login` and `/api/v1/auth/register` to prevent brute force.
- [ ] **NoSQL Injection**: Ensure `sanitize-middleware` or Mongoose built-ins are stripping `$` operators from user input.
- [ ] **JWT Security**: Verify `JWT_SECRET` is strong and `httpOnly` cookies are used.
- [ ] **RBAC Enforcement**: Verify that `user`, `seller`, and `admin` roles cannot access each other's restricted routes.
- [ ] **Data Sanitization**: Strip HTML/Scripts from product descriptions and reviews (XSS).
- [ ] **IDOR Protection**: Ensure a user cannot view or delete another user's cart/order via ID manipulation.
- [ ] **Stock Race Conditions**: Use atomic updates (`$inc` with stock check) rather than Read-Modify-Write.

---

## 3. Missing Validations

1.  **Auth (Password Complexity)**: Current validation only checks length >= 6. Should require 1 uppercase and 1 number.
2.  **User (Phone)**: Address phone numbers should be strictly validated against Indian format (+91 or 10 digits).
3.  **Product (Image Count)**: No limit on the number of images in the `images` array.
4.  **Order (Address)**: ZipCode should be exactly 6 digits (Indian PIN code).
5.  **Coupon (Global Limit)**: Ensure `usageLimit` is checked before allowing coupon application.
6.  **Seller (Verification)**: Sellers should be able to update ONLY their own products.

---

## 4. Edge Cases

- [ ] **Price Change**: Product price changes while it's in a user's cart (System should use current price at checkout).
- [ ] **Concurrent Checkout**: Two users buying the last item simultaneously (One must fail gracefully).
- [ ] **Negative Quantities**: Attempting to set cart quantity to -1 or 0 via API.
- [ ] **Coupon Hopping**: Applying a coupon, placing an order, then trying to reuse it beyond `perUserLimit`.
- [ ] **Free Products**: Handling products with ₹0 discounted price (Ensure subtotal and coupon logic don't divide by zero or break).
- [ ] **Invalid Categories**: Trying to link a product to a non-existent category ID.
