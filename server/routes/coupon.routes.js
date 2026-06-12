import { Router } from 'express';
import { 
  createCoupon, 
  getAllCoupons, 
  updateCoupon, 
  deleteCoupon, 
  applyCoupon 
} from '../controllers/coupon.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createCouponSchema, updateCouponSchema } from '../validators/index.js';

const router = Router();

// Apply Coupon (available to logged-in users)
router.post('/apply', verifyJWT, applyCoupon);

// Administrative CRUD operations (Admin and Seller)
router.post('/', verifyJWT, authorizeRoles('admin', 'seller'), validate({ body: createCouponSchema }), createCoupon);
router.get('/', verifyJWT, authorizeRoles('admin', 'seller'), getAllCoupons);
router.put('/:id', verifyJWT, authorizeRoles('admin', 'seller'), validate({ body: updateCouponSchema }), updateCoupon);
router.delete('/:id', verifyJWT, authorizeRoles('admin', 'seller'), deleteCoupon);

export default router;
