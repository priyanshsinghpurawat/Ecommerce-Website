import { Router } from 'express';
import { 
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from '../controllers/subcategory.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getSubcategories);
router.post('/', verifyJWT, authorizeRoles('admin'), createSubcategory);
router.put('/:id', verifyJWT, authorizeRoles('admin'), updateSubcategory);
router.delete('/:id', verifyJWT, authorizeRoles('admin'), deleteSubcategory);

export default router;
