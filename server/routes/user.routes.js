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
  getSellers,
  toggleSellerStatus,
  getSellerProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/user.controller.js';
import { getPublicSellerStore } from '../controllers/storefront.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { updateUserSchema, addressSchema } from '../validators/index.js';
import { upload, requireCloudinary } from '../middleware/upload.middleware.js';

const router = Router();

// Public routes
router.get('/store/:slug', getPublicSellerStore);

// Admin routes

/**
 * @openapi
 * /api/v3/users:
 *   get:
 *     summary: Get all users with search, role filter, pagination (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of users with pagination
 */
router.get('/', verifyJWT, authorizeRoles('admin'), getAllUsers);

/**
 * @openapi
 * /api/v3/users/{id}/role:
 *   patch:
 *     summary: Update a user's role (Admin only)
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.patch('/:id/role', verifyJWT, authorizeRoles('admin'), updateUserRole);

// Seller management (Admin)

/**
 * @openapi
 * /api/v3/users/sellers:
 *   get:
 *     summary: Get all sellers (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all sellers
 */
router.get('/sellers', verifyJWT, authorizeRoles('admin'), getSellers);

/**
 * @openapi
 * /api/v3/users/sellers/{id}:
 *   get:
 *     summary: Get a specific seller's profile (Admin only)
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
 *         description: Seller profile details
 */
router.get('/sellers/:id', verifyJWT, authorizeRoles('admin'), getSellerProfile);

/**
 * @openapi
 * /api/v3/users/sellers/{id}/status:
 *   patch:
 *     summary: Toggle seller active status (Admin only)
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
 *         description: Seller status toggled successfully
 */
router.patch('/sellers/:id/status', verifyJWT, authorizeRoles('admin'), toggleSellerStatus);

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
 *         description: Profile details of current user
 */
router.get('/me', verifyJWT, getProfile);

/**
 * @openapi
 * /api/v3/users/profile:
 *   put:
 *     summary: Update profile details (Name, phone, brandName, bio, address)
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
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', verifyJWT, validate(updateUserSchema), updateProfile);

/**
 * @openapi
 * /api/v3/users/avatar:
 *   post:
 *     summary: Upload avatar image
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar', verifyJWT, upload.single('avatar'), requireCloudinary, uploadAvatar);

// Address Management routes

/**
 * @openapi
 * /api/v3/users/addresses:
 *   post:
 *     summary: Add new address
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, street, city, state, zipCode, country, phone]
 *             properties:
 *               fullName:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address added successfully
 */
router.post('/addresses', verifyJWT, validate(addressSchema), addAddress);

/**
 * @openapi
 * /api/v3/users/addresses/{id}:
 *   put:
 *     summary: Update an address
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
 *               fullName:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.put('/addresses/:id', verifyJWT, validate(addressSchema), updateAddress);

/**
 * @openapi
 * /api/v3/users/addresses/{id}:
 *   delete:
 *     summary: Delete an address
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
 *     summary: Set an address as default
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
 *         description: Address set as default successfully
 */
router.patch('/addresses/:id/default', verifyJWT, setDefaultAddress);

// Wishlist routes

/**
 * @openapi
 * /api/v3/users/wishlist:
 *   get:
 *     summary: Get user wishlist
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User wishlist retrieved successfully
 */
router.get('/wishlist', verifyJWT, getWishlist);

/**
 * @openapi
 * /api/v3/users/wishlist/{productId}:
 *   post:
 *     summary: Add product to wishlist
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
 *         description: Product added to wishlist successfully
 */
router.post('/wishlist/:productId', verifyJWT, addToWishlist);

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
