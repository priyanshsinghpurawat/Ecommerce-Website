import { Router } from 'express';
import { 
  createCategory, 
  getAllCategories, 
  getCategoryBySlug, 
  updateCategory, 
  deleteCategory 
} from '../controllers/category.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/index.js';

const router = Router();

// Public read routes

/**
 * @openapi
 * /api/v3/categories:
 *   get:
 *     summary: Retrieve list of all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 */
router.get('/', getAllCategories);

/**
 * @openapi
 * /api/v3/categories/{slug}:
 *   get:
 *     summary: Retrieve a single category by its slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:slug', getCategoryBySlug);

// Admin-only write routes

/**
 * @openapi
 * /api/v3/categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', verifyJWT, authorizeRoles('admin'), validate({ body: createCategorySchema }), createCategory);

/**
 * @openapi
 * /api/v3/categories/{id}:
 *   put:
 *     summary: Update an existing category (Admin only)
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/:id', verifyJWT, authorizeRoles('admin'), validate({ body: updateCategorySchema }), updateCategory);

/**
 * @openapi
 * /api/v3/categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 */
router.delete('/:id', verifyJWT, authorizeRoles('admin'), deleteCategory);

export default router;
