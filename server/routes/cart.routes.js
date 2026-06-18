import { Router } from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart 
} from '../controllers/cart.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { addToCartSchema, updateCartQuantitySchema, cartItemIdParamSchema } from '../validators/cart.schema.js';

const router = Router();

// Secure all routes in this router with JWT authentication
router.use(verifyJWT);

router.get('/', getCart);
router.post('/add', validate(addToCartSchema), addToCart);
router.put('/update', validate(updateCartQuantitySchema), updateCartItemQuantity);
router.delete('/remove/:itemId', validate(cartItemIdParamSchema), removeFromCart);
router.delete('/clear', clearCart);

export default router;
