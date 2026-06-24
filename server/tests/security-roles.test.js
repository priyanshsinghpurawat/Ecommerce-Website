import { describe, it, beforeAll as before, afterAll as after, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { Order } from '../models/order.model.js';
import { connectTestDb, disconnectTestDb, clearCollections } from './helpers.js';

before(async () => {
  await connectTestDb();
});

after(async () => {
  await disconnectTestDb();
}, 30000);

beforeEach(async () => {
  await clearCollections();
});

async function getToken(email, role = 'user') {
  const password = 'User1P@ss303!';
  await request(app).post('/api/v3/auth/register').send({
    name: 'Test User',
    email,
    password
  });
  await User.findOneAndUpdate({ email }, { role });
  const res = await request(app).post('/api/v3/auth/login').send({
    email,
    password
  });
  return res.body.data.token;
}

describe('Security & RBAC Deep-Dive', () => {
  it('should prevent a seller from deleting another seller\'s product', async () => {
    await getToken('seller1@test.com', 'seller');
    const seller2Token = await getToken('seller2@test.com', 'seller');
    const seller1Id = (await User.findOne({ email: 'seller1@test.com' }))._id;

    const cat = await Category.create({ name: 'Security' });
    const sub = await Subcategory.create({ name: 'Locks', category: cat._id });
    
    const product = await Product.create({
      title: 'Seller 1 Product',
      price: 100,
      stock: 10,
      category: cat._id,
      subcategory: sub._id,
      description: 'd',
      seller: seller1Id
    });

    // Seller 2 tries to delete Seller 1's product
    await request(app)
      .delete(`/api/v3/products/${product._id}`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .expect(403);

    // Verify product still exists
    const stillExists = await Product.findById(product._id);
    assert.ok(stillExists);
  });

  it('should prevent a regular user from accessing admin analytics', async () => {
    const userToken = await getToken('user@test.com', 'user');
    
    await request(app)
      .get('/api/v3/orders/analytics')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should prevent a user from viewing another user\'s order', async () => {
    await getToken('u1@test.com', 'user');
    const user2Token = await getToken('u2@test.com', 'user');
    const user1Id = (await User.findOne({ email: 'u1@test.com' }))._id;

    const order = await Order.create({
      orderNumber: 'ORD-123',
      user: user1Id,
      items: [],
      subtotal: 100,
      total: 118,
      shippingAddress: { fullName: 'X', phone: '1234567890', street: 'S', city: 'C', state: 'ST', zipCode: '123456', country: 'India' },
      paymentMethod: 'cod'
    });

    // User 2 tries to view User 1's order
    await request(app)
      .get(`/api/v3/orders/${order._id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(403);
  });

  it('should prevent non-admins from changing user roles', async () => {
    const user1Token = await getToken('u1@test.com', 'user');
    const user2 = await User.create({ name: 'U2', email: 'u2@test.com', password: 'Password123!', role: 'user' });

    await request(app)
      .patch(`/api/v3/users/${user2._id}/role`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ role: 'admin' })
      .expect(403);

    const checkUser2 = await User.findById(user2._id);
    assert.equal(checkUser2.role, 'user');
  });

  it('should block unauthorized access to vendor profiles', async () => {
    const userToken = await getToken('user@test.com', 'user');
    const seller = await User.create({ name: 'S', email: 's@test.com', password: 'Password123!', role: 'seller' });

    await request(app)
      .get(`/api/v3/users/vendors/${seller._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
