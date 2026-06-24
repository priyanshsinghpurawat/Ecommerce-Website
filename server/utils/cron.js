/** WHY: Background tasks to fix stock locks and keep the server from idling. */
import cron from 'node-cron';
import axios from 'axios';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { ENV } from '../config/env.js';

/**
 * Automates the cleanup of expired pending orders.
 * When a user starts a Razorpay checkout, stock is reserved (decremented).
 * If they don't complete the payment within 30 minutes, this job:
 * 1. Finds the pending order.
 * 2. Returns the stock to the product.
 * 3. Marks the order as 'cancelled'.
 */
export const initInventoryCron = () => {
  // 1. Inventory Recovery Job (Every 10 minutes)
  cron.schedule('*/10 * * * *', async () => {
    console.log('[Cron] Checking for expired pending orders...');
    
    try {
      const expirationTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      const expiredOrders = await Order.find({
        status: 'pending',
        paymentMethod: 'razorpay',
        createdAt: { $lt: expirationTime }
      });

      if (expiredOrders.length === 0) return;

      console.log(`[Cron] Found ${expiredOrders.length} expired orders. Recovering...`);

      const productUpdates = [];
      const orderUpdates = [];

      for (const order of expiredOrders) {
        for (const item of order.items) {
          if (item.size || item.color) {
            productUpdates.push({
              updateOne: {
                filter: {
                  _id: item.product,
                  variants: {
                    $elemMatch: {
                      size: item.size || '',
                      color: item.color || ''
                    }
                  }
                },
                update: {
                  $inc: {
                    "variants.$.stock": item.quantity,
                    stock: item.quantity
                  }
                }
              }
            });
          } else {
            productUpdates.push({
              updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: item.quantity } }
              }
            });
          }
        }
        orderUpdates.push(order._id);
      }

      // Execute bulk updates for performance
      if (productUpdates.length > 0) {
        await Product.bulkWrite(productUpdates);
      }

      if (orderUpdates.length > 0) {
        await Order.updateMany(
          { _id: { $in: orderUpdates } },
          { $set: { status: 'cancelled', paymentStatus: 'failed' } }
        );
      }

      console.log(`[Cron] Successfully recovered ${expiredOrders.length} orders.`);
    } catch (error) {
      console.error('[Cron] Inventory recovery failed:', error.message);
    }
  });

  // 2. Self-Ping Job (Every 14 minutes) — keeps Render free tier awake
  cron.schedule('*/14 * * * *', async () => {
    if (!ENV.SERVER_URL) return;
    try {
      const url = `${ENV.SERVER_URL}/api/v3/health`;
      await axios.get(url);
      console.log(`[Cron] Self-ping successful.`);
    } catch (error) {
      console.error('[Cron] Self-ping failed:', error.message);
    }
  });

  console.log('[Cron] All background schedulers initialized');
};
