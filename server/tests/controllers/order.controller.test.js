import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { app } from '../../app.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { Variant } from '../../models/variant.model.js';
import { Cart } from '../../models/cart.model.js';
import { Order } from '../../models/order.model.js';
import { AffiliateLink } from '../../models/affiliateLink.model.js';
import { Category } from '../../models/category.model.js';
import { Subcategory } from '../../models/subcategory.model.js';
import { generateAccessToken } from '../../utils/jwt.js';

let mongod, buyer, seller, category, subcategory, product;
let buyerToken, sellerToken;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    mongod = await MongoMemoryReplSet.create({
      replSet: { storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(mongod.getUri());
  }

  // Ensure indexes are built to prevent background index build write conflicts
  await Promise.all([
    User.ensureIndexes(),
    Product.ensureIndexes(),
    Variant.ensureIndexes(),
    Cart.ensureIndexes(),
    Order.ensureIndexes(),
    Category.ensureIndexes(),
    Subcategory.ensureIndexes(),
  ]);

  // Create roles
  buyer = await User.create({
    name: 'Buyer User',
    email: 'buyer@example.com',
    password: 'Password@123',
    role: 'user',
  });
  buyerToken = generateAccessToken(buyer);

  seller = await User.create({
    name: 'Seller User',
    email: 'seller@example.com',
    password: 'Password@123',
    role: 'seller',
  });
  sellerToken = generateAccessToken(seller);
  category = await Category.create({ name: 'Apparel' });
  subcategory = await Subcategory.create({ name: 'T-shirts', category: category._id });
});

afterAll(async () => {
  if (mongod) {
    await mongoose.disconnect();
    await mongod.stop();
  }
});

afterEach(async () => {
  await Order.deleteMany({});
  await Cart.deleteMany({});
  await Variant.deleteMany({});
  await Product.deleteMany({});
});

describe('Order Controller Integration Tests', () => {
  const shippingAddress = {
    fullName: 'Jane Doe',
    phone: '9876543210',
    street: '123 Fashion Ave',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India',
  };

  const setupCatalogItem = async (stock = 10, useVariant = false) => {
    product = await Product.create({
      title: 'Drip Tee',
      description: 'Cool street drip tee',
      price: 1000,
      stock: useVariant ? 0 : stock,
      image: '/drippy.jpg',
      category: category._id,
      subcategory: subcategory._id,
      seller: seller._id,
      productCode: 'DRIP-TEE-99',
    });

    if (useVariant) {
      await Variant.create({
        product: product._id,
        sku: 'DRIP-TEE-RED-M',
        price: 1200,
        stock: stock,
        optionValues: new Map([
          ['Color', 'Red'],
          ['Size', 'M'],
        ]),
      });
      await Product.recalculateVariantSummary(product._id);
    }
  };

  it('should place a COD order successfully (happy path)', async () => {
    await setupCatalogItem(5, false);

    // Populate user's cart
    await Cart.create({
      user: buyer._id,
      items: [{ product: product._id, quantity: 2 }],
    });

    const res = await request(app)
      .post('/api/v3/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        shippingAddress,
        paymentMethod: 'cod',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.paymentMethod).toBe('cod');
    expect(res.body.data.status).toBe('confirmed'); // COD defaults to confirmed
    expect(res.body.data.items[0].product.toString()).toBe(product._id.toString());

    // Verify stock is deducted
    const updatedProd = await Product.findById(product._id);
    expect(updatedProd.stock).toBe(3);

    // Verify cart is cleared
    const updatedCart = await Cart.findOne({ user: buyer._id });
    expect(updatedCart.items.length).toBe(0);
  });

  it('should reject order if cart is empty', async () => {
    // Make sure cart is empty/non-existent
    await Cart.deleteOne({ user: buyer._id });

    const res = await request(app)
      .post('/api/v3/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        shippingAddress,
        paymentMethod: 'cod',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('empty');
  });

  it('should handle order status transitions (valid + invalid)', async () => {
    await setupCatalogItem(10, false);

    // Place order
    await Cart.create({
      user: buyer._id,
      items: [{ product: product._id, quantity: 1 }],
    });

    const orderRes = await request(app)
      .post('/api/v3/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        shippingAddress,
        paymentMethod: 'cod',
      });

    const orderId = orderRes.body.data._id;

    // Seller updates status to shipped (Valid transition: confirmed -> shipped / partially_shipped)
    const validTransitionRes = await request(app)
      .patch(`/api/v3/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        status: 'shipped',
      });

    expect(validTransitionRes.status).toBe(200);
    expect(validTransitionRes.body.success).toBe(true);

    // Invalid transition: try to update shipped to confirmed (cannot revert shipping status)
    const invalidTransitionRes = await request(app)
      .patch(`/api/v3/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        status: 'confirmed',
      });

    expect(invalidTransitionRes.status).toBe(400);
    expect(invalidTransitionRes.body.success).toBe(false);
  });

  it('should process return request window correctly (within/outside 7 days)', async () => {
    await setupCatalogItem(5, false);

    // Create an order directly in DB
    const orderNum = 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const orderItems = [
      {
        product: product._id,
        title: product.title,
        price: product.price,
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
        seller: seller._id,
        status: 'delivered',
      },
    ];

    // Case 1: Within 7 days
    const orderWithin7Days = await Order.create({
      orderNumber: orderNum + 'A',
      user: buyer._id,
      items: [
        {
          ...orderItems[0],
          deliveryDate: new Date(),
        },
      ],
      subtotal: 1000,
      total: 1000,
      shippingAddress,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      status: 'delivered',
      deliveredAt: new Date(), // Delivered today
    });

    const returnWithinRes = await request(app)
      .post(`/api/v3/orders/${orderWithin7Days._id}/items/${orderWithin7Days.items[0]._id}/return`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        reason: 'Item defective',
      });

    expect(returnWithinRes.status).toBe(200);
    expect(returnWithinRes.body.success).toBe(true);

    // Case 2: Outside 7-day window (e.g. 10 days ago)
    const orderOutside7Days = await Order.create({
      orderNumber: orderNum + 'B',
      user: buyer._id,
      items: [
        {
          ...orderItems[0],
          deliveryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ],
      subtotal: 1000,
      total: 1000,
      shippingAddress,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      status: 'delivered',
      deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });

    const returnOutsideRes = await request(app)
      .post(
        `/api/v3/orders/${orderOutside7Days._id}/items/${orderOutside7Days.items[0]._id}/return`,
      )
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        reason: 'Changed mind',
      });

    expect(returnOutsideRes.status).toBe(400);
    expect(returnOutsideRes.body.success).toBe(false);
    expect(returnOutsideRes.body.message).toContain('window');
  });

  it('should track affiliate click and attribute conversion/revenue on purchase', async () => {
    // 1. Create affiliate link in DB
    const trackingTag = 'test-tag-999';
    await AffiliateLink.create({
      seller: seller._id,
      targetProduct: product._id,
      targetUrl: `/product/${product._id}?ref=${trackingTag}`,
      trackingTag,
      campaignName: 'Black Friday Campaign',
    });

    // 2. Track click on affiliate link
    const clickRes = await request(app).post(`/api/v3/affiliates/track/${trackingTag}`).send();

    expect(clickRes.status).toBe(200);
    expect(clickRes.body.success).toBe(true);

    const linkAfterClick = await AffiliateLink.findOne({ trackingTag });
    expect(linkAfterClick.metrics.clicks).toBe(1);
    expect(linkAfterClick.metrics.conversions).toBe(0);

    // 3. Setup catalog and fill buyer cart
    await setupCatalogItem(5, false);
    await Cart.create({
      user: buyer._id,
      items: [{ product: product._id, quantity: 1 }],
    });

    // 4. Place order with attributionTag
    const orderRes = await request(app)
      .post('/api/v3/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        shippingAddress,
        paymentMethod: 'cod',
        attributionTag: trackingTag,
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    expect(orderRes.body.data.attributionTag).toBe(trackingTag);

    // 5. Verify affiliate metrics updated with conversion & revenue
    const linkAfterPurchase = await AffiliateLink.findOne({ trackingTag });
    expect(linkAfterPurchase.metrics.clicks).toBe(1);
    expect(linkAfterPurchase.metrics.conversions).toBe(1);
    expect(linkAfterPurchase.metrics.revenueGenerated).toBe(orderRes.body.data.total);
  });
});
