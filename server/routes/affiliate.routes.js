import { Router } from 'express';
import { generateAffiliateLink, getMyAffiliateLinks, trackClick, deleteAffiliateLink } from '../controllers/affiliate.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/v3/affiliates/track/{tag}:
 *   post:
 *     summary: Track an affiliate link click
 *     tags: [Affiliates]
 *     parameters:
 *       - in: path
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Click tracked
 */
router.post('/track/:tag', trackClick);

router.use(verifyJWT);
router.use(authorizeRoles('admin', 'seller'));

/**
 * @openapi
 * /api/v3/affiliates:
 *   get:
 *     summary: Get seller affiliate links
 *     tags: [Affiliates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of affiliate links
 */
router.get('/', getMyAffiliateLinks);

/**
 * @openapi
 * /api/v3/affiliates/generate:
 *   post:
 *     summary: Generate an affiliate link
 *     tags: [Affiliates]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Affiliate link generated
 */
router.post('/generate', generateAffiliateLink);

/**
 * @openapi
 * /api/v3/affiliates/{id}:
 *   delete:
 *     summary: Delete an affiliate link
 *     tags: [Affiliates]
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
 *         description: Affiliate link deleted
 */
router.delete('/:id', deleteAffiliateLink);

export default router;