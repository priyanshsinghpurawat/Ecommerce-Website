import { describe, it, before, after, beforeEach } from 'node:test';
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

/**
 * MASTER API ENDPOINTS TEST SUITE
 * 
 * This file contains comprehensive integration tests for all major API modules:
 * 1. Authentication & RBAC (Role Based Access Control)
 * 2. Categories & Subcategories
 * 3. Products (Listing, Searching, Security)
 * 4. Cart & Order Management
 * 
 * Designed for easy understanding by new developers and interns.
 */

before(async () => {
  await connectTestDb();
  // Bypass Cloudinary for tests
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

/* --- TEST HELPERS --- */

/**
 * Creates a standard user and returns their JWT token.
 */
async function getUserToken(email = 'user@example.com') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Regular User',
    email,
    password: 'StrongP@ss123!'
  });
  const res = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'StrongP@ss123!'
  });
  return res.body.data.token;
}

/**
 * Creates an admin user and returns their JWT token.
 */
async function getAdminToken() {
  const adminData = {
    name: 'Admin User',
    email: 'admin@mensvibe.com',
    password: 'StrongP@ss123!'
  };
  await request(app).post('/api/v1/auth/register').send(adminData);
  await User.findOneAndUpdate({ email: adminData.email }, { role: 'admin' });
  const res = await request(app).post('/api/v1/auth/login').send({
    email: adminData.email,
    password: adminData.password
  });
  return res.body.data.token;
}

/* --- API TESTS --- */

describe('1. Authentication & Security', () => {
  it('should register a new user and hash their password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Intern User', email: 'intern@test.com', password: 'StrongP@ss123!' })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'intern@test.com');
    
    const userInDb = await User.findOne({ email: 'intern@test.com' }).select('+password');
    assert.notEqual(userInDb.password, 'StrongP@ss123!', 'Password should be encrypted in DB');
  });

  it('should return a valid JWT token on successful login', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Tester', email: 'test@login.com', password: 'StrongP@ss123!' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@login.com', password: 'StrongP@ss123!' })
      .expect(200);

    assert.ok(res.body.data.token, 'Response should contain a JWT token');
  });

  it('should reject login with an incorrect password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Tester', email: 'wrong@pass.com', password: 'StrongP@ss123!' });

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@pass.com', password: 'WrongP@ss123!' })
      .expect(401);
  });

  it('should protect /auth/me and only allow valid tokens', async () => {
    // 1. Fail without token
    await request(app).get('/api/v1/auth/me').expect(401);

    // 2. Succeed with valid token
    const token = await getUserToken();
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.equal(res.body.data.email, 'user@example.com');
  });
});

describe('2. Categories & Subcategories', () => {
  it('should allow Admins to create categories, but block regular users', async () => {
    const userToken = await getUserToken();
    const adminToken = await getAdminToken();

    // User fails (403 Forbidden)
    await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Forbidden Tier' })
      .expect(403);

    // Admin succeeds
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Arrivals' })
      .expect(201);

    assert.equal(res.body.data.name, 'New Arrivals');
  });

  it('should correctly handle a full CRUD cycle for categories', async () => {
    const token = await getAdminToken();

    // Create
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Gadgets' })
      .expect(201);
    const catId = createRes.body.data._id;

    // Update
    await request(app)
      .put(`/api/v1/categories/${catId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Electronic Gadgets' })
      .expect(200);

    // List & Verify
    const listRes = await request(app).get('/api/v1/categories').expect(200);
    assert.ok(listRes.body.data.some(c => c.name === 'Electronic Gadgets'));

    // Delete
    await request(app)
      .delete(`/api/v1/categories/${catId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});

describe('3. Product Management & Catalog', () => {
  it('should return a list of products with pagination and search', async () => {
    const cat = await Category.create({ name: 'Clothing' });
    const sub = await Subcategory.create({ name: 'Tees', category: cat._id });
    
    await Product.create([
      { title: 'Alpha Shirt', price: 500, category: cat._id, subcategory: sub._id, stock: 10, description: 'd', seller: new mongoose.Types.ObjectId() },
      { title: 'Beta Pants', price: 800, category: cat._id, subcategory: sub._id, stock: 10, description: 'd', seller: new mongoose.Types.ObjectId() }
    ]);

    // Test Search
    const searchRes = await request(app).get('/api/v1/products?search=shirt').expect(200);
    assert.equal(searchRes.body.data.products.length, 1);

    // Test Pagination (Limit 1)
    const pageRes = await request(app).get('/api/v1/products?page=1&limit=1').expect(200);
    assert.equal(pageRes.body.data.products.length, 1);
    assert.ok(pageRes.body.data.pagination.totalPages >= 2);
  });

  it('should protect against NoSQL injection in the search field', async () => {
    // Attempting to pass an object instead of a string to search
    await request(app)
      .get('/api/v1/products?search[$gt]=')
      .expect(400, 'We must block object injection to prevent security leaks');
  });

  it('should enforce pricing logic: discountedPrice must be less than original price', async () => {
    const cat = await Category.create({ name: 'Test' });
    const sub = await Subcategory.create({ name: 'Test', category: cat._id });
    
    const invalidProduct = new Product({
      title: 'Bad Price',
      price: 1000,
      discountedPrice: 1500, // INVALID
      category: cat._id,
      subcategory: sub._id,
      stock: 10,
      description: 'd'
    });

    await assert.rejects(async () => await invalidProduct.save(), /must be strictly less/);
  });
});

describe('4. Cart & Checkout (Complex Flows)', () => {
  it('should add products to cart and respect stock limits', async () => {
    const token = await getUserToken();
    const cat = await Category.create({ name: 'Cat' });
    const sub = await Subcategory.create({ name: 'Sub', category: cat._id });
    const product = await Product.create({
      title: 'Limited Item', price: 100, stock: 5, category: cat._id, subcategory: sub._id, description: 'd', seller: new mongoose.Types.ObjectId()
    });

    // Valid add
    await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, quantity: 2 })
      .expect(200);

    // Invalid add (too many)
    await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, quantity: 10 })
      .expect(400);
  });

  it('should complete a full checkout flow and decrement stock', async () => {
    const token = await getUserToken();
    const cat = await Category.create({ name: 'Shop' });
    const sub = await Subcategory.create({ name: 'Items', category: cat._id });
    const product = await Product.create({
      title: 'T-Shirt', price: 1000, stock: 10, category: cat._id, subcategory: sub._id, description: 'd', seller: new mongoose.Types.ObjectId()
    });

    await Coupon.create({
      code: 'WELCOME100', discountType: 'flat', discountValue: 100, minCartAmount: 500, isActive: true
    });

    // 1. Add to cart
    await request(app).post('/api/v1/cart/add').set('Authorization', `Bearer ${token}`).send({ productId: product._id, quantity: 1 });

    // 2. Checkout
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: 'John Doe', phone: '9876543210', street: '123 St', city: 'Mumbai', state: 'MH', zipCode: '400001'
        },
        couponCode: 'WELCOME100',
        paymentMethod: 'cod'
      })
      .expect(201);

    assert.equal(orderRes.body.data.total, 1062, 'Price should be (1000 - 100) + 18% tax');
    
    // 3. Verify side effects
    const updatedProduct = await Product.findById(product._id);
    assert.equal(updatedProduct.stock, 9, 'Stock should decrease by 1');
  });

  it('should prevent overselling via atomic stock checks during concurrent checkouts', async () => {
    const cat = await Category.create({ name: 'Flash' });
    const sub = await Subcategory.create({ name: 'Sale', category: cat._id });
    const product = await Product.create({
      title: 'Last Unit', price: 100, stock: 1, category: cat._id, subcategory: sub._id, description: 'd', seller: new mongoose.Types.ObjectId()
    });

    const user1 = await getUserToken('u1@test.com');
    const user2 = await getUserToken('u2@test.com');

    // Both add the same single unit to their cart
    await request(app).post('/api/v1/cart/add').set('Authorization', `Bearer ${user1}`).send({ productId: product._id, quantity: 1 });
    await request(app).post('/api/v1/cart/add').set('Authorization', `Bearer ${user2}`).send({ productId: product._id, quantity: 1 });

    const ship = { fullName: 'X', phone: '9876543210', street: 'S', city: 'C', state: 'ST', zipCode: '123456' };

    // Simultaneous checkout
    const [res1, res2] = await Promise.all([
      request(app).post('/api/v1/orders').set('Authorization', `Bearer ${user1}`).send({ shippingAddress: ship }),
      request(app).post('/api/v1/orders').set('Authorization', `Bearer ${user2}`).send({ shippingAddress: ship })
    ]);

    const statuses = [res1.status, res2.status];
    assert.ok(statuses.includes(201), 'One user must succeed');
    assert.ok(statuses.includes(400) || statuses.includes(500) || statuses.includes(409), 'Second user must fail due to stock depletion or transaction conflict');
  });
});