import { describe, it, beforeAll as before, afterAll as after, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/user.model.js';
import { Coupon } from '../models/coupon.model.js';
import { Cart } from '../models/cart.model.js';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';
import { connectTestDb, disconnectTestDb, clearCollections } from './helpers.js';

before(async () => {
  await connectTestDb();
  process.env.CLOUDINARY_CLOUD_NAME = 'mock_cloud';
  process.env.CLOUDINARY_API_KEY = 'mock_key';
  process.env.CLOUDINARY_API_SECRET = 'mock_secret';
});

after(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearCollections();
});

async function getUserToken(email = 'user@example.com') {
  await request(app).post('/api/v3/auth/register').send({
    name: 'Regular User',
    email,
    password: 'StrongP@ss123!'
  });
  const res = await request(app).post('/api/v3/auth/login').send({
    email,
    password: 'StrongP@ss123!'
  });
  return res.body.data.token;
}

async function getAdminToken(email = 'admin@mensvibe.com') {
  await request(app).post('/api/v3/auth/register').send({
    name: 'Admin User',
    email,
    password: 'StrongP@ss123!'
  });
  await User.findOneAndUpdate({ email }, { role: 'admin' });
  const res = await request(app).post('/api/v3/auth/login').send({
    email,
    password: 'StrongP@ss123!'
  });
  return res.body.data.token;
}

describe('Coupon Controller & Endpoints', () => {
  it('should allow admin to create a new coupon', async () => {
    const adminToken = await getAdminToken();

    const res = await request(app)
      .post('/api/v3/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'SUMMER20',
        discountType: 'percentage',
        discountValue: 20,
        minCartAmount: 500,
        usageLimit: 100,
        perUserLimit: 2
      })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.code, 'SUMMER20');
    assert.equal(res.body.data.discountValue, 20);
  });

  it('should block non-admins from creating a coupon', async () => {
    const userToken = await getUserToken();

    await request(app)
      .post('/api/v3/coupons')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        code: 'HACKER50',
        discountType: 'flat',
        discountValue: 50
      })
      .expect(403);
  });

  it('should not allow duplicate coupon codes', async () => {
    const adminToken = await getAdminToken();

    await request(app)
      .post('/api/v3/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'UNIQUE', discountType: 'flat', discountValue: 100 })
      .expect(201);

    const res = await request(app)
      .post('/api/v3/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'unique', discountType: 'flat', discountValue: 200 }) // case-insensitive check
      .expect(409);

    assert.match(res.body.message, /already exists/i);
  });

  it('should fetch all coupons with pagination and search for admin', async () => {
    const adminToken = await getAdminToken();

    await Coupon.create([
      { code: 'WINTER10', discountType: 'percentage', discountValue: 10 },
      { code: 'WINTER20', discountType: 'percentage', discountValue: 20 },
      { code: 'SUMMER50', discountType: 'flat', discountValue: 50 }
    ]);

    const res = await request(app)
      .get('/api/v3/coupons?search=WINTER')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    assert.equal(res.body.data.coupons.length, 2);
    assert.equal(res.body.data.pagination.totalCoupons, 2);
  });

  it('should update an existing coupon', async () => {
    const adminToken = await getAdminToken();

    const coupon = await Coupon.create({
      code: 'OLDCODE',
      discountType: 'flat',
      discountValue: 100
    });

    const res = await request(app)
      .put(`/api/v3/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'NEWCODE',
        discountValue: 150
      })
      .expect(200);

    assert.equal(res.body.data.code, 'NEWCODE');
    assert.equal(res.body.data.discountValue, 150);

    // Verify DB
    const updatedCoupon = await Coupon.findById(coupon._id);
    assert.equal(updatedCoupon.code, 'NEWCODE');
  });

  it('should delete a coupon', async () => {
    const adminToken = await getAdminToken();

    const coupon = await Coupon.create({
      code: 'TODELETE',
      discountType: 'flat',
      discountValue: 10
    });

    await request(app)
      .delete(`/api/v3/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const deletedCoupon = await Coupon.findById(coupon._id);
    assert.equal(deletedCoupon, null);
  });

  it('should apply a valid coupon to a user cart', async () => {
    const userToken = await getUserToken();
    const user = await User.findOne({ email: 'user@example.com' });

    const cat = await Category.create({ name: 'Apparel' });
    const sub = await Subcategory.create({ name: 'T-Shirts', category: cat._id });
    const product = await Product.create({
      title: 'Cool Shirt',
      price: 1000,
      stock: 50,
      category: cat._id,
      subcategory: sub._id,
      description: 'Test',
      seller: new mongoose.Types.ObjectId()
    });

    // Create cart
    await Cart.create({
      user: user._id,
      items: [{ product: product._id, quantity: 2, price: 1000 }] // Total 2000
    });

    // Create Coupon
    await Coupon.create({
      code: 'FLAT500',
      discountType: 'flat',
      discountValue: 500,
      minCartAmount: 1000,
      isActive: true
    });

    const res = await request(app)
      .post('/api/v3/coupons/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'FLAT500' })
      .expect(200);

    assert.equal(res.body.data.discountAmount, 500);
    assert.equal(res.body.data.finalTotal, 1500); // 2000 - 500
  });

  it('should reject applying a coupon below minimum cart amount', async () => {
    const userToken = await getUserToken();
    const user = await User.findOne({ email: 'user@example.com' });

    const cat = await Category.create({ name: 'Apparel' });
    const sub = await Subcategory.create({ name: 'T-Shirts', category: cat._id });
    const product = await Product.create({
      title: 'Cheap Shirt',
      price: 200,
      stock: 50,
      category: cat._id,
      subcategory: sub._id,
      description: 'Test',
      seller: new mongoose.Types.ObjectId()
    });

    // Create cart (Total 200)
    await Cart.create({
      user: user._id,
      items: [{ product: product._id, quantity: 1, price: 200 }]
    });

    // Create Coupon
    await Coupon.create({
      code: 'MIN500',
      discountType: 'flat',
      discountValue: 100,
      minCartAmount: 500,
      isActive: true
    });

    const res = await request(app)
      .post('/api/v3/coupons/apply')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'MIN500' })
      .expect(400);

    assert.match(res.body.message, /minimum purchase/i);
  });
});
