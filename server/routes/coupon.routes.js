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

/**
 * @openapi
 * /api/v3/coupons/apply:
 *   post:
 *     summary: Apply coupon and calculate discounts
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 */
router.post('/apply', verifyJWT, applyCoupon);

// Administrative CRUD operations (Admin and Seller)

/**
 * @openapi
 * /api/v3/coupons:
 *   post:
 *     summary: Create a new coupon (Admin or Seller only)
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, flat]
 *               discountValue:
 *                 type: number
 *               minCartAmount:
 *                 type: number
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.post('/', verifyJWT, authorizeRoles('admin', 'seller'), validate({ body: createCouponSchema }), createCoupon);

/**
 * @openapi
 * /api/v3/coupons:
 *   get:
 *     summary: Get all coupons (Admin or Seller only)
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 */
router.get('/', verifyJWT, authorizeRoles('admin', 'seller'), getAllCoupons);

/**
 * @openapi
 * /api/v3/coupons/{id}:
 *   put:
 *     summary: Update coupon (Admin or Seller only)
 *     tags: [Coupons]
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
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, flat]
 *               discountValue:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 */
router.put('/:id', verifyJWT, authorizeRoles('admin', 'seller'), validate({ body: updateCouponSchema }), updateCoupon);

/**
 * @openapi
 * /api/v3/coupons/{id}:
 *   delete:
 *     summary: Delete coupon (Admin or Seller only)
 *     tags: [Coupons]
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
 *         description: Coupon deleted successfully
 */
router.delete('/:id', verifyJWT, authorizeRoles('admin', 'seller'), deleteCoupon);

export default router;
