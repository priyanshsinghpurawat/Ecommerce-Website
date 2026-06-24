import { describe, it, beforeAll as before, afterAll as after, beforeEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import crypto from 'crypto';

// Mock Razorpay before importing the app
vi.mock('razorpay', () => {
  return {
    default: class Razorpay {
      constructor() {
        this.orders = {
          create: vi.fn().mockResolvedValue({ id: 'rzp_order_mock_123' })
        };
      }
    }
  };
});

import { app } from '../app.js';
import { ENV } from '../config/env.js';
import { connectTestDb, disconnectTestDb, clearCollections } from './helpers.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';
import { Cart } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';

before(async () => {
  await connectTestDb();
  // Override ENV for Razorpay
  ENV.RAZORPAY_KEY_ID = 'mock_rzp_key';
  ENV.RAZORPAY_KEY_SECRET = 'mock_rzp_secret';
});

after(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearCollections();
});

async function getUserToken(email = 'user@example.com') {
  await request(app).post('/api/v3/auth/register').send({
    name: 'Payment User',
    email,
    password: 'StrongP@ss123!'
  });
  const res = await request(app).post('/api/v3/auth/login').send({
    email,
    password: 'StrongP@ss123!'
  });
  return res.body.data.token;
}

describe('Payment Controller & Endpoints', () => {
  it('should return the correct payment configuration', async () => {
    const token = await getUserToken();

    const res = await request(app)
      .get('/api/v3/payments/config')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(res.body.data.razorpayEnabled, true);
    assert.equal(res.body.data.keyId, 'mock_rzp_key');
  });

  it('should create a checkout order successfully', async () => {
    const token = await getUserToken();
    const user = await User.findOne({ email: 'user@example.com' });

    const cat = await Category.create({ name: 'Tech' });
    const sub = await Subcategory.create({ name: 'Gadgets', category: cat._id });
    const product = await Product.create({
      title: 'Smart Watch',
      price: 5000,
      stock: 10,
      category: cat._id,
      subcategory: sub._id,
      description: 'Test Watch',
      seller: new mongoose.Types.ObjectId()
    });

    await Cart.create({
      user: user._id,
      items: [{ product: product._id, quantity: 1, price: 5000 }]
    });

    const shippingAddress = {
      fullName: 'John Doe',
      phone: '9876543210',
      street: 'Main St',
      city: 'Delhi',
      state: 'DL',
      zipCode: '110001'
    };

    const res = await request(app)
      .post('/api/v3/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ shippingAddress })
      .expect(201);

    assert.equal(res.body.data.razorpayOrderId, 'rzp_order_mock_123');
    assert.ok(res.body.data.orderId);
    
    const dbOrder = await Order.findById(res.body.data.orderId);
    assert.equal(dbOrder.paymentMethod, 'razorpay');
    assert.equal(dbOrder.status, 'pending');
    assert.equal(dbOrder.razorpayOrderId, 'rzp_order_mock_123');
  });

  it('should successfully verify a valid Razorpay signature', async () => {
    const token = await getUserToken();
    const user = await User.findOne({ email: 'user@example.com' });

    // Simulate an existing pending order
    const order = await Order.create({
      orderNumber: 'ORD-TEST-123',
      user: user._id,
      items: [],
      subtotal: 1000,
      taxAmount: 0,
      discountAmount: 0,
      total: 1000,
      shippingAddress: { fullName: 'A', phone: '1', street: 'S', city: 'C', state: 'ST', zipCode: '1' },
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      status: 'pending',
      razorpayOrderId: 'rzp_order_mock_123'
    });

    const razorpay_order_id = 'rzp_order_mock_123';
    const razorpay_payment_id = 'pay_29QQoUBi66xm2f';
    
    // Generate valid signature using the mocked secret
    const secret = ENV.RAZORPAY_KEY_SECRET; // 'mock_rzp_secret'
    const razorpay_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const res = await request(app)
      .post('/api/v3/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId: order._id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      })
      .expect(200);

    assert.equal(res.body.data.paymentStatus, 'paid');
    assert.equal(res.body.data.status, 'confirmed');

    // Verify DB update
    const updatedOrder = await Order.findById(order._id);
    assert.equal(updatedOrder.paymentStatus, 'paid');
    assert.equal(updatedOrder.status, 'confirmed');
  });

  it('should reject an invalid Razorpay signature', async () => {
    const token = await getUserToken();
    const user = await User.findOne({ email: 'user@example.com' });

    const cat = await Category.create({ name: 'Tech' });
    const sub = await Subcategory.create({ name: 'Gadgets', category: cat._id });
    const product = await Product.create({
      title: 'Smart Watch',
      price: 5000,
      stock: 10,
      category: cat._id,
      subcategory: sub._id,
      description: 'Test Watch',
      seller: new mongoose.Types.ObjectId()
    });

    const order = await Order.create({
      orderNumber: 'ORD-TEST-FAIL',
      user: user._id,
      items: [{ product: product._id, quantity: 2, price: 5000, title: 'Smart Watch', unitPrice: 5000, subtotal: 10000 }],
      subtotal: 10000,
      taxAmount: 0,
      discountAmount: 0,
      total: 10000,
      shippingAddress: { fullName: 'A', phone: '1', street: 'S', city: 'C', state: 'ST', zipCode: '1' },
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      status: 'pending',
      razorpayOrderId: 'rzp_order_mock_123'
    });

    // Send invalid signature
    const res = await request(app)
      .post('/api/v3/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId: order._id,
        razorpay_order_id: 'rzp_order_mock_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'invalid_signature_string'
      })
      .expect(400);

    assert.match(res.body.message, /Payment verification failed/i);

    // Verify DB update (Order should be failed and stock released)
    const failedOrder = await Order.findById(order._id);
    assert.equal(failedOrder.paymentStatus, 'failed');
    assert.equal(failedOrder.status, 'cancelled');

    // Stock should be restored
    const updatedProduct = await Product.findById(product._id);
    assert.equal(updatedProduct.stock, 12); // 10 initial + 2 restored
  });
});
