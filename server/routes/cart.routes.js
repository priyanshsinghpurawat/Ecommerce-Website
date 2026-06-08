import { Router } from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart 
} from '../controllers/cart.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all routes in this router with JWT authentication
router.get('/', verifyJWT, getCart);
router.post('/add', verifyJWT, addToCart);
router.put('/update', verifyJWT, updateCartItemQuantity);
router.delete('/remove/:productId', verifyJWT, removeFromCart);
router.delete('/clear', verifyJWT, clearCart);

export default router;
