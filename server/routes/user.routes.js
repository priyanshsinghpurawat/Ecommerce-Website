import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAllUsers,
  updateUserRole,
  getVendors,
  toggleVendorStatus,
  getVendorProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/user.controller.js';
import { getPublicVendorStore } from '../controllers/storefront.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { updateUserSchema, addressSchema } from '../validators/index.js';
import { upload, requireCloudinary } from '../middleware/upload.middleware.js';

const router = Router();

// Public routes
router.get('/store/:slug', getPublicVendorStore);

// Admin routes

/**
 * @openapi
 * /api/v3/users:
 *   get:
 *     summary: Get all users list (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all registered users
 */
router.get('/', verifyJWT, authorizeRoles('admin'), getAllUsers);

/**
 * @openapi
 * /api/v3/users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, seller]
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.patch('/:id/role', verifyJWT, authorizeRoles('admin'), updateUserRole);

// Vendor management (Admin)

/**
 * @openapi
 * /api/v3/users/vendors:
 *   get:
 *     summary: Get all vendors (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all vendors
 */
router.get('/vendors', verifyJWT, authorizeRoles('admin'), getVendors);

/**
 * @openapi
 * /api/v3/users/vendors/{id}:
 *   get:
 *     summary: Get a specific vendor's profile (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor profile details
 */
router.get('/vendors/:id', verifyJWT, authorizeRoles('admin'), getVendorProfile);

/**
 * @openapi
 * /api/v3/users/vendors/{id}/status:
 *   patch:
 *     summary: Toggle vendor active status (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor status toggled successfully
 */
router.patch('/vendors/:id/status', verifyJWT, authorizeRoles('admin'), toggleVendorStatus);

// Profile routes

/**
 * @openapi
 * /api/v3/users/me:
 *   get:
 *     summary: Get logged-in user profile details
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/me', verifyJWT, getProfile);

/**
 * @openapi
 * /api/v3/users/me:
 *   put:
 *     summary: Update logged-in user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               brandName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/me', verifyJWT, validate({ body: updateUserSchema }), updateProfile);

/**
 * @openapi
 * /api/v3/users/me/avatar:
 *   post:
 *     summary: Upload profile avatar image
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/me/avatar', verifyJWT, requireCloudinary, upload.single('avatar'), uploadAvatar);

// Address book routes

/**
 * @openapi
 * /api/v3/users/addresses:
 *   post:
 *     summary: Add shipping address to address book
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *               - street
 *               - city
 *               - state
 *               - zipCode
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               street: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               zipCode: { type: string }
 *               country: { type: string, default: India }
 *               isDefault: { type: boolean }
 *     responses:
 *       201:
 *         description: Address added successfully
 */
router.post('/addresses', verifyJWT, validate({ body: addressSchema }), addAddress);

/**
 * @openapi
 * /api/v3/users/addresses/{id}:
 *   put:
 *     summary: Update a shipping address
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               phone: { type: string }
 *               street: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               zipCode: { type: string }
 *               country: { type: string }
 *               isDefault: { type: boolean }
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.put('/addresses/:id', verifyJWT, validate({ body: addressSchema.partial() }), updateAddress);

/**
 * @openapi
 * /api/v3/users/addresses/{id}:
 *   delete:
 *     summary: Delete shipping address from address book
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */
router.delete('/addresses/:id', verifyJWT, deleteAddress);

/**
 * @openapi
 * /api/v3/users/addresses/{id}/default:
 *   patch:
 *     summary: Mark a shipping address as default
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Set address as default successfully
 */
router.patch('/addresses/:id/default', verifyJWT, setDefaultAddress);

// Wishlist routes

/**
 * @openapi
 * /api/v3/users/wishlist:
 *   get:
 *     summary: Get logged-in user's wishlist
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist products list retrieved successfully
 */
router.get('/wishlist', verifyJWT, getWishlist);

/**
 * @openapi
 * /api/v3/users/wishlist:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
 */
router.post('/wishlist', verifyJWT, addToWishlist);

/**
 * @openapi
 * /api/v3/users/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 */
router.delete('/wishlist/:productId', verifyJWT, removeFromWishlist);

export default router;
