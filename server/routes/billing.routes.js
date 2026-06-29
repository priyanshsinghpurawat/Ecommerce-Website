import { Router } from 'express';
import { getMyLedger } from '../controllers/billing.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Protected Seller routes
router.use(verifyJWT);
router.use(authorizeRoles('admin', 'seller'));

router.get('/my-ledger', getMyLedger);

export default router;
