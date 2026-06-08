import { Router } from 'express';
import {
  createCheckout,
  verifyPayment,
  getPaymentConfig
} from '../controllers/payment.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/config', verifyJWT, getPaymentConfig);
router.post('/checkout', verifyJWT, createCheckout);
router.post('/verify', verifyJWT, verifyPayment);

export default router;
