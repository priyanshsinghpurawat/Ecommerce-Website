import { describe, it, beforeAll as before, afterAll as after, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';
import { Coupon } from '../models/coupon.model.js';
import { connectTestDb, disconnectTestDb, clearCollections } from './helpers.js';

before(async () => {
  await connectTestDb();
  process.env.CLOUDINARY_CLOUD_NAME = 'mock_cloud';
  process.env.CLOUDINARY_API_KEY = 'mock_key';
  process.env.CLOUDINARY_API_SECRET = 'mock_secret';
});

after(async () => {
  await disconnectTestDb();
}, 30000);

beforeEach(async () => {
  await clearCollections();
});

async function getUserToken(email, name = 'Test User') {
  await request(app).post('/api/v1/auth/register').send({
    name,
    email,
    password: 'StrongP@ss123!'
  });
  const res = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'StrongP@ss123!'
  });
  return res.body.data.token;
}

async function getAdminToken() {
  const adminEmail = 'admin@mensvibe.com';
  await request(app).post('/api/v1/auth/register').send({
    name: 'Admin User',
    email: adminEmail,
    password: 'StrongP@ss123!'
  });
  await User.findOneAndUpdate({ email: adminEmail }, { role: 'admin' });
  const res = await request(app).post('/api/v1/auth/login').send({
    email: adminEmail,
    password: 'StrongP@ss123!'
  });
  return res.body.data.token;
}

describe('Variant Stock & Coupon Cap Integration Tests', () => {
  it('should decrement variant stock on order placement and restore it on cancellation', async () => {
    const token = await getUserToken('buyer@test.com', 'Buyer');

    // Create category and subcategory
    const cat = await Category.create({ name: 'Apparel', slug: 'apparel' });
    const sub = await Subcategory.create({ name: 'Shirts', slug: 'shirts', category: cat._id });

    // Create a product with variants
    const product = await Product.create({
      title: 'Variant Shirt',
      description: 'A great shirt with variants',
      price: 100,
      stock: 20, // root stock
      category: cat._id,
      subcategory: sub._id,
      seller: new mongoose.Types.ObjectId(),
      variants: [
        { color: 'Red', size: 'M', sku: 'VS-RED-M', stock: 5, price: 100, images: [] },
        { color: 'Blue', size: 'L', sku: 'VS-BLUE-L', stock: 15, price: 100, images: [] }
      ]
    });

    // Add Red M to cart
    await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product._id.toString(),
        quantity: 2,
        color: 'Red',
        size: 'M'
      })
      .expect(200);

    // Place order (COD)
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: 'Recipient Name',
          phone: '9876543210',
          street: '123 Test St',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        paymentMethod: 'cod'
      })
      .expect(201);

    // Check stocks
    const updatedProd = await Product.findById(product._id);
    assert.equal(updatedProd.stock, 18, 'Root stock should decrement by 2');
    assert.equal(updatedProd.variants[0].stock, 3, 'Red M variant stock should decrement by 2');
    assert.equal(updatedProd.variants[1].stock, 15, 'Blue L variant stock should remain unchanged');

    // Cancel order using admin token
    const adminToken = await getAdminToken();
    const orderId = orderRes.body.data._id;
    await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'cancelled' })
      .expect(200);

    // Check stocks restored
    const restoredProd = await Product.findById(product._id);
    assert.equal(restoredProd.stock, 20, 'Root stock should restore to 20');
    assert.equal(restoredProd.variants[0].stock, 5, 'Red M variant stock should restore to 5');
  });

  it('should handle concurrent checkouts atomically and prevent variant overselling', async () => {
    const token1 = await getUserToken('user1@test.com', 'User One');
    const token2 = await getUserToken('user2@test.com', 'User Two');

    const cat = await Category.create({ name: 'Apparel 2', slug: 'apparel-2' });
    const sub = await Subcategory.create({ name: 'Shirts 2', slug: 'shirts-2', category: cat._id });

    // Create product with only 1 stock for Red M
    const product = await Product.create({
      title: 'Limited Shirt',
      description: 'Only one left',
      price: 150,
      stock: 1,
      category: cat._id,
      subcategory: sub._id,
      seller: new mongoose.Types.ObjectId(),
      variants: [
        { color: 'Red', size: 'M', sku: 'LIM-RED-M', stock: 1, price: 150, images: [] }
      ]
    });

    // Add to both carts
    await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${token1}`)
      .send({ productId: product._id.toString(), quantity: 1, color: 'Red', size: 'M' })
      .expect(200);

    await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${token2}`)
      .send({ productId: product._id.toString(), quantity: 1, color: 'Red', size: 'M' })
      .expect(200);

    // Send concurrent order requests
    const shipping = {
      fullName: 'Name',
      phone: '9876543210',
      street: '123 St',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    };

    const [res1, res2] = await Promise.all([
      request(app).post('/api/v1/orders').set('Authorization', `Bearer ${token1}`).send({ shippingAddress: shipping, paymentMethod: 'cod' }),
      request(app).post('/api/v1/orders').set('Authorization', `Bearer ${token2}`).send({ shippingAddress: shipping, paymentMethod: 'cod' })
    ]);

    // One must succeed, one must fail
    const statuses = [res1.status, res2.status];
    assert.ok(statuses.includes(201), 'One request should succeed');
    assert.ok(statuses.includes(400) || statuses.includes(500), 'One request should fail due to stock');

    const finalProd = await Product.findById(product._id);
    assert.equal(finalProd.stock, 0, 'Root stock should be 0');
    assert.equal(finalProd.variants[0].stock, 0, 'Variant stock should be 0');
  });

  it('should cap flat coupon discount to the applicable items subtotal rather than cart total', async () => {
    const token = await getUserToken('coupon-user@test.com', 'Coupon User');

    const cat = await Category.create({ name: 'Electronics', slug: 'electronics' });
    const sub = await Subcategory.create({ name: 'Gadgets', slug: 'gadgets', category: cat._id });

    // Vendor A
    const sellerA = new mongoose.Types.ObjectId();
    const prodA = await Product.create({
      title: 'Applicable Product',
      description: 'Applicable',
      price: 40,
      stock: 10,
      category: cat._id,
      subcategory: sub._id,
      seller: sellerA
    });

    // Vendor B
    const sellerB = new mongoose.Types.ObjectId();
    const prodB = await Product.create({
      title: 'Other Product',
      description: 'Other',
      price: 100,
      stock: 10,
      category: cat._id,
      subcategory: sub._id,
      seller: sellerB
    });

    // Create flat discount coupon of 50 restricted to Seller A
    await Coupon.create({
      code: 'FLAT50A',
      discountType: 'flat',
      discountValue: 50,
      minCartAmount: 10,
      seller: sellerA,
      isActive: true,
      expiryDate: new Date(Date.now() + 24 * 3600 * 1000)
    });

    // Add both products to cart
    await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: prodA._id.toString(), quantity: 1 })
      .expect(200);

    await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: prodB._id.toString(), quantity: 1 })
      .expect(200);

    // Place order with coupon FLAT50A
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: 'Name',
          phone: '9876543210',
          street: '123 St',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India'
        },
        paymentMethod: 'cod',
        couponCode: 'FLAT50A'
      })
      .expect(201);

    // Total subtotal: 140 (40 + 100).
    // Flat discount is 50, but since only prodA (price 40) is applicable, the discount must be capped at 40.
    // Final subtotal taxable value should be 140 - 40 = 100.
    // Tax is 18% of taxable value: 18.
    // Total is 100 + 18 = 118.
    const order = orderRes.body.data;
    assert.equal(order.discountAmount, 40, 'Discount amount should be capped at 40');
    assert.equal(order.subtotal, 140, 'Subtotal should be 140');
    assert.equal(order.total, 118, 'Total should be 118 (100 taxable + 18 tax)');
  });
});
