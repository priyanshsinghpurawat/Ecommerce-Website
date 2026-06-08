import { Router } from 'express';
import {
  getProfile,
  updateProfile,
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
  setDefaultAddress
} from '../controllers/user.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { updateUserSchema, addressSchema } from '../validators/index.js';

const router = Router();

// Admin routes
router.get('/', verifyJWT, authorizeRoles('admin'), getAllUsers);
router.patch('/:id/role', verifyJWT, authorizeRoles('admin'), updateUserRole);

// Vendor management (Admin)
router.get('/vendors', verifyJWT, authorizeRoles('admin'), getVendors);
router.get('/vendors/:id', verifyJWT, authorizeRoles('admin'), getVendorProfile);
router.patch('/vendors/:id/status', verifyJWT, authorizeRoles('admin'), toggleVendorStatus);

router.get('/me', verifyJWT, getProfile);
router.put('/me', verifyJWT, validate({ body: updateUserSchema }), updateProfile);

// Address book routes
router.post('/addresses', verifyJWT, validate({ body: addressSchema }), addAddress);
router.put('/addresses/:id', verifyJWT, validate({ body: addressSchema.partial() }), updateAddress);
router.delete('/addresses/:id', verifyJWT, deleteAddress);
router.patch('/addresses/:id/default', verifyJWT, setDefaultAddress);

// Wishlist routes
router.get('/wishlist', verifyJWT, getWishlist);
router.post('/wishlist', verifyJWT, addToWishlist);
router.delete('/wishlist/:productId', verifyJWT, removeFromWishlist);

export default router;
