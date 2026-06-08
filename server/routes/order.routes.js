import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderAnalytics
} from '../controllers/order.controller.js';
import { verifyJWT, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/index.js';

const router = Router();

router.post('/', verifyJWT, validate({ body: createOrderSchema }), createOrder);
router.get('/my', verifyJWT, getMyOrders);
router.get('/analytics', verifyJWT, authorizeRoles('admin'), getOrderAnalytics);
router.get('/', verifyJWT, authorizeRoles('admin', 'seller'), getAllOrders);
router.patch('/:id/status', verifyJWT, authorizeRoles('admin'), validate({ body: updateOrderStatusSchema }), updateOrderStatus);
router.get('/:id', verifyJWT, getOrderById);

export default router;
