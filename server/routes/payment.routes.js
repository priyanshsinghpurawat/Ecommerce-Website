import { Router } from 'express';
import {
  createCheckout,
  verifyPayment,
  getPaymentConfig
} from '../controllers/payment.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Strict limit for checkouts/verifications
  message: { success: false, message: 'Too many payment requests. Please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true'
});

router.use(paymentLimiter);

/**
 * @openapi
 * /api/v3/payments/config:
 *   get:
 *     summary: Get payment processor configuration parameters (Razorpay public key)
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 */
router.get('/config', verifyJWT, getPaymentConfig);

/**
 * @openapi
 * /api/v3/payments/checkout:
 *   post:
 *     summary: Initiate a Razorpay payment order for checkout
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressIndex
 *             properties:
 *               addressIndex:
 *                 type: integer
 *                 description: Index of the selected shipping address in user's profile
 *               couponCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment order initialized successfully
 */
router.post('/checkout', verifyJWT, createCheckout);

/**
 * @openapi
 * /api/v3/payments/verify:
 *   post:
 *     summary: Verify Razorpay webhook signature and finalize order payment status
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *     responses:
 *       200:
 *         description: Payment verified and order finalized successfully
 */
router.post('/verify', verifyJWT, verifyPayment);

export default router;
