import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderAnalytics,
  exportOrdersCSV,
  requestReturn,
  processReturn
} from '../controllers/order.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/index.js';

const router = Router();

/**
 * @openapi
 * /api/v3/orders:
 *   post:
 *     summary: Place an order from the user's cart
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - fullName
 *                   - phone
 *                   - street
 *                   - city
 *                   - state
 *                   - zipCode
 *                 properties:
 *                   fullName: { type: string }
 *                   phone: { type: string }
 *                   street: { type: string }
 *                   city: { type: string }
 *                   state: { type: string }
 *                   zipCode: { type: string }
 *               couponCode:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, razorpay, demo]
 *                 default: cod
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 */
router.post('/', verifyJWT, validate({ body: createOrderSchema }), createOrder);

/**
 * @openapi
 * /api/v3/orders/my:
 *   get:
 *     summary: Get logged-in user's order history
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successful retrieval
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/my', verifyJWT, getMyOrders);

/**
 * @openapi
 * /api/v3/orders/{id}/items/{itemId}/return:
 *   post:
 *     summary: Request a return for an order item
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/items/:itemId/return', verifyJWT, requestReturn);

/**
 * @openapi
 * /api/v3/orders/analytics:
 *   get:
 *     summary: Get orders performance analytics (Admin only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 */
router.get('/analytics', verifyJWT, authorizeRoles('admin'), getOrderAnalytics);

/**
 * @openapi
 * /api/v3/orders/export/csv:
 *   get:
 *     summary: Export orders metadata as CSV (Admin only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export/csv', verifyJWT, authorizeRoles('admin'), exportOrdersCSV);

/**
 * @openapi
 * /api/v3/orders:
 *   get:
 *     summary: List all orders (Admin or Seller only)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Orders list retrieved successfully
 */
router.get('/', verifyJWT, authorizeRoles('admin', 'seller'), getAllOrders);

/**
 * @openapi
 * /api/v3/orders/{id}/status:
 *   patch:
 *     summary: Update order or item delivery status (Admin or Seller only)
 *     tags: [Orders]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, partially_shipped, shipped, delivered, cancelled]
 *               itemId:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', verifyJWT, authorizeRoles('admin', 'seller'), validate({ body: updateOrderStatusSchema }), updateOrderStatus);

/**
 * @openapi
 * /api/v3/orders/{id}/items/{itemId}/process-return:
 *   put:
 *     summary: Process a return request (approve/reject/refund)
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
router.put('/:id/items/:itemId/process-return', verifyJWT, authorizeRoles('admin', 'seller'), processReturn);

/**
 * @openapi
 * /api/v3/orders/{id}:
 *   get:
 *     summary: Retrieve single order details
 *     tags: [Orders]
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
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
router.get('/:id', verifyJWT, getOrderById);

export default router;
