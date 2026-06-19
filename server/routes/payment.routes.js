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
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true'
});

router.use(paymentLimiter);

router.get('/config', verifyJWT, getPaymentConfig);
router.post('/checkout', verifyJWT, createCheckout);
router.post('/verify', verifyJWT, verifyPayment);

export default router;
