import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  mergeCart,
} from '../controllers/cart.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  addToCartSchema,
  updateCartQuantitySchema,
  cartItemIdParamSchema,
  mergeCartSchema,
} from '../validators/cart.schema.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many cart requests. Please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true',
});

router.use(cartLimiter);

// Secure all routes in this router with JWT authentication
router.use(verifyJWT);

/**
 * @openapi
 * /api/v3/cart:
 *   get:
 *     summary: Retrieve user's shopping cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Shopping cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.get('/', getCart);

/**
 * @openapi
 * /api/v3/cart/add:
 *   post:
 *     summary: Add product to shopping cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 */
router.post('/add', validate(addToCartSchema), addToCart);

/**
 * @openapi
 * /api/v3/cart/update:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - quantity
 *             properties:
 *               itemId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item quantity updated successfully
 */
router.put('/update', validate(updateCartQuantitySchema), updateCartItemQuantity);

/**
 * @openapi
 * /api/v3/cart/remove/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 */
router.delete('/remove/:itemId', validate(cartItemIdParamSchema), removeFromCart);

/**
 * @openapi
 * /api/v3/cart/clear:
 *   delete:
 *     summary: Clear entire shopping cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/clear', clearCart);

router.post('/merge', validate(mergeCartSchema), mergeCart);

export default router;
