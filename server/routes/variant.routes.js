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

// Product-scoped variant routes
router.get(
  '/products/:id/variants',
  validate({ params: productIdParamSchema }),
  getProductVariants
);

router.post(
  '/products/:id/variants/generate',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  validate({ params: productIdParamSchema }),
  generateVariants
);

router.post(
  '/products/:id/variants/bulk',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  validate({ params: productIdParamSchema }),
  bulkUpsertVariants
);

// Standalone variant routes
router.patch(
  '/variants/:id/stock',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  updateVariantStock
);

router.delete(
  '/variants/:id',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  deleteVariant
);

router.patch(
  '/variants/:id/sku-lock',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  toggleSkuLock
);

router.patch(
  '/variants/bulk-stock',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  bulkUpdateStock
);

export default router;
