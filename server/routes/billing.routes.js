import { Router } from 'express';
import { getMyLedger } from '../controllers/billing.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);
router.use(authorizeRoles('admin', 'seller'));

/**
 * @openapi
 * /api/v3/billing/my-ledger:
 *   get:
 *     summary: Get seller/admin billing ledger
 *     tags: [Billing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Ledger retrieved
 */
router.get('/my-ledger', getMyLedger);

export default router;
