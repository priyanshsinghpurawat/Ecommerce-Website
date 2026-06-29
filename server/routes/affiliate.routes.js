import { Router } from 'express';
import { generateAffiliateLink, getMyAffiliateLinks, trackClick } from '../controllers/affiliate.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Public route for tracking clicks
router.post('/track/:tag', trackClick);

// Protected Seller routes
router.use(verifyJWT);
router.use(authorizeRoles('admin', 'seller'));

router.get('/', getMyAffiliateLinks);
router.post('/generate', generateAffiliateLink);

export default router;
