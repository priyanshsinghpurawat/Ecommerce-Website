import cron from 'node-cron';
import axios from 'axios';
import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { restoreStock } from '../services/order.service.js';
import { ENV } from '../config/env.js';
import logger from '../config/logger.js';

export const initInventoryCron = () => {
  cron.schedule('*/10 * * * *', async () => {
    logger.info('[Cron] Checking for expired pending orders...');

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const expirationTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      const expiredOrders = await Order.find({
        status: 'pending',
        paymentMethod: 'razorpay',
        createdAt: { $lt: expirationTime },
      }).session(session);

      if (expiredOrders.length === 0) {
        await session.commitTransaction();
        session.endSession();
        return;
      }

      logger.info(`[Cron] Found ${expiredOrders.length} expired orders. Recovering...`);

      for (const order of expiredOrders) {
        await restoreStock(order.items, session);
      }

      const orderUpdates = expiredOrders.map((order) => order._id);
      await Order.updateMany(
        { _id: { $in: orderUpdates } },
        { $set: { status: 'cancelled', paymentStatus: 'failed' } },
        { session },
      );

      await session.commitTransaction();
      logger.info(`[Cron] Successfully recovered ${expiredOrders.length} orders.`);
    } catch (error) {
      await session.abortTransaction();
      logger.error('[Cron] Inventory recovery failed', { error: error.message });
    } finally {
      session.endSession();
    }
  });

  cron.schedule('*/14 * * * *', async () => {
    if (!ENV.SERVER_URL) return;
    try {
      const url = `${ENV.SERVER_URL}/api/v3/health`;
      await axios.get(url);
      logger.info('[Cron] Self-ping successful.');
    } catch (error) {
      logger.error('[Cron] Self-ping failed', { error: error.message });
    }
  });

  logger.info('[Cron] All background schedulers initialized');
};
