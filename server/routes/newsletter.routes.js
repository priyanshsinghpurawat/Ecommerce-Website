import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { subscribe } from '../controllers/newsletter.controller.js';

const router = Router();

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many subscription attempts. Try again later.' },
});

router.post('/', newsletterLimiter, subscribe);

export default router;
