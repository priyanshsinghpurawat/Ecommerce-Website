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
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Admin-only write routes
router.post('/', verifyJWT, authorizeRoles('admin'), validate({ body: createCategorySchema }), createCategory);
router.put('/:id', verifyJWT, authorizeRoles('admin'), validate({ body: updateCategorySchema }), updateCategory);
router.delete('/:id', verifyJWT, authorizeRoles('admin'), deleteCategory);

export default router;
