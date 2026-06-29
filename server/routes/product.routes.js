import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getProductFilters,
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

/**
 * @openapi
 * /api/v3/products:
 *   get:
 *     summary: Retrieve products list
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *       - in: query
 *         name: badge
 *         schema:
 *           type: string
 *           enum: [new-arrival, sale, street-drip, limited-edition]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/', getAllProducts);

router.get('/filters', getProductFilters);

/**
 * @openapi
 * /api/v3/products/{id}:
 *   get:
 *     summary: Get product by ID or Slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', validate({ params: productIdParamSchema }), getProductById);

/**
 * @openapi
 * /api/v3/products/{id}/frequently-bought-together:
 *   get:
 *     summary: Get frequently bought together products
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of frequently bought together products
 */
router.get('/:id/frequently-bought-together', validate({ params: productIdParamSchema }), getFrequentlyBoughtTogether);

// Auth-protected writes. Order matters:
// 1) auth → 2) cloudinary precheck → 3) multer parse → 4) zod validate → 5) handler
// (zod runs AFTER multer because multipart bodies only exist post-parse.)

/**
 * @openapi
 * /api/v3/products:
 *   post:
 *     summary: Create a product (Admin or Seller only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - category
 *               - subcategory
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discountedPrice:
 *                 type: number
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               stock:
 *                 type: number
 *               gender:
 *                 type: string
 *                 enum: [men, women, unisex]
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  '/',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  requireCloudinary,
  uploadAny(),
  validate({ body: productBodySchema }),
  createProduct
);

/**
 * @openapi
 * /api/v3/products/{id}:
 *   put:
 *     summary: Update product details (Admin or Seller only)
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               discountedPrice:
 *                 type: number
 *               category:
 *                 type: string
 *               subcategory:
 *                 type: string
 *               stock:
 *                 type: number
 *               gender:
 *                 type: string
 *                 enum: [men, women, unisex]
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put(
  '/:id',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  requireCloudinary,
  uploadAny(),
  validate({ params: productIdParamSchema, body: productBodySchema }),
  updateProduct
);

/**
 * @openapi
 * /api/v3/products/{id}:
 *   delete:
 *     summary: Delete a product (Admin or Seller only)
 *     tags: [Products]
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
 *         description: Product deleted successfully
 */
router.delete(
  '/:id',
  verifyJWT,
  authorizeRoles('admin', 'seller'),
  validate({ params: productIdParamSchema }),
  deleteProduct
);

export default router;
