import { Router } from 'express';
import { getProductReviews, submitReview, deleteReview } from '../controllers/review.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { productIdParamSchema } from '../validators/index.js';
import { z } from 'zod';

const router = Router();

const reviewBodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1, 'Comment is required').max(1000),
});

const reviewIdParamSchema = z.object({
  reviewId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid review ID format'),
});

/**
 * @openapi
 * /api/v3/products/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/products/:id/reviews', validate({ params: productIdParamSchema }), getProductReviews);

/**
 * @openapi
 * /api/v3/products/{id}/reviews:
 *   post:
 *     summary: Submit a review for a product
 *     tags: [Reviews]
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
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted
 */
router.post(
  '/products/:id/reviews',
  verifyJWT,
  validate({ params: productIdParamSchema, body: reviewBodySchema }),
  submitReview,
);

/**
 * @openapi
 * /api/v3/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete(
  '/reviews/:reviewId',
  verifyJWT,
  validate({ params: reviewIdParamSchema }),
  deleteReview,
);

export default router;
