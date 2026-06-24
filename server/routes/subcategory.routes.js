import { Router } from 'express';
import { 
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from '../controllers/subcategory.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/v3/subcategories:
 *   get:
 *     summary: Retrieve list of all subcategories
 *     tags: [Subcategories]
 *     responses:
 *       200:
 *         description: Subcategories list retrieved successfully
 */
router.get('/', getSubcategories);

/**
 * @openapi
 * /api/v3/subcategories:
 *   post:
 *     summary: Create a new subcategory (Admin only)
 *     tags: [Subcategories]
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
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Parent category ObjectId
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subcategory created successfully
 */
router.post('/', verifyJWT, authorizeRoles('admin'), createSubcategory);

/**
 * @openapi
 * /api/v3/subcategories/{id}:
 *   put:
 *     summary: Update an existing subcategory (Admin only)
 *     tags: [Subcategories]
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
 *               category:
 *                 type: string
 *                 description: Parent category ObjectId
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subcategory updated successfully
 */
router.put('/:id', verifyJWT, authorizeRoles('admin'), updateSubcategory);

/**
 * @openapi
 * /api/v3/subcategories/{id}:
 *   delete:
 *     summary: Delete a subcategory (Admin only)
 *     tags: [Subcategories]
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
 *         description: Subcategory deleted successfully
 */
router.delete('/:id', verifyJWT, authorizeRoles('admin'), deleteSubcategory);

export default router;
