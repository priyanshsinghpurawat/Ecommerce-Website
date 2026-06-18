import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  getFrequentlyBoughtTogether,
  updateProduct,
  deleteProduct
} from '../controllers/product.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadAny, requireCloudinary } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.js';
import { productBodySchema, productIdParamSchema } from '../validators/index.js';

const router = Router();

// Public reads
router.get('/', getAllProducts);
router.get('/:id', validate({ params: productIdParamSchema }), getProductById);
router.get('/:id/frequently-bought-together', validate({ params: productIdParamSchema }), getFrequentlyBoughtTogether);

// Auth-protected writes. Order matters:
// 1) auth → 2) cloudinary precheck → 3) multer parse → 4) zod validate → 5) handler
// (zod runs AFTER multer because multipart bodies only exist post-parse.)
router.post(
  '/',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  requireCloudinary,
  uploadAny(),
  validate({ body: productBodySchema }),
  createProduct
);

router.put(
  '/:id',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  requireCloudinary,
  uploadAny(),
  validate({ params: productIdParamSchema, body: productBodySchema }),
  updateProduct
);

router.delete(
  '/:id',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  validate({ params: productIdParamSchema }),
  deleteProduct
);

export default router;
