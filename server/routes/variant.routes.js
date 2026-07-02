import { Router } from 'express';
import {
  generateVariants,
  bulkUpsertVariants,
  updateVariantStock,
  getProductVariants,
  deleteVariant,
  toggleSkuLock,
  bulkUpdateStock
} from '../controllers/variant.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { productIdParamSchema } from '../validators/index.js';

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /api/v3/products/{id}/variants:
 *   get:
 *     summary: Get variants for a product
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of variants
 */
router.get(
  '/products/:id/variants',
  validate({ params: productIdParamSchema }),
  getProductVariants
);

/**
 * @openapi
 * /api/v3/products/{id}/variants/generate:
 *   post:
 *     summary: Generate variants from product options
 *     tags: [Variants]
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
 *         description: Variants generated
 */
router.post(
  '/products/:id/variants/generate',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  validate({ params: productIdParamSchema }),
  generateVariants
);

/**
 * @openapi
 * /api/v3/products/{id}/variants/bulk:
 *   post:
 *     summary: Bulk upsert variants
 *     tags: [Variants]
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
 *         description: Variants upserted
 */
router.post(
  '/products/:id/variants/bulk',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  validate({ params: productIdParamSchema }),
  bulkUpsertVariants
);

/**
 * @openapi
 * /api/v3/variants/{id}/stock:
 *   patch:
 *     summary: Update variant stock
 *     tags: [Variants]
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
 *         description: Stock updated
 */
router.patch(
  '/variants/:id/stock',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  updateVariantStock
);

/**
 * @openapi
 * /api/v3/variants/{id}:
 *   delete:
 *     summary: Delete a variant
 *     tags: [Variants]
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
 *         description: Variant deleted
 */
router.delete(
  '/variants/:id',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  deleteVariant
);

/**
 * @openapi
 * /api/v3/variants/{id}/sku-lock:
 *   patch:
 *     summary: Toggle SKU lock on a variant
 *     tags: [Variants]
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
 *         description: SKU lock toggled
 */
router.patch(
  '/variants/:id/sku-lock',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  toggleSkuLock
);

/**
 * @openapi
 * /api/v3/variants/bulk-stock:
 *   patch:
 *     summary: Bulk update stock for multiple variants
 *     tags: [Variants]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bulk stock updated
 */
router.patch(
  '/variants/bulk-stock',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  bulkUpdateStock
);

export default router;