import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { Variant } from '../../models/variant.model.js';
import { Category } from '../../models/category.model.js';
import { Subcategory } from '../../models/subcategory.model.js';
import { Order } from '../../models/order.model.js';
import { Coupon } from '../../models/coupon.model.js';
import { Cart } from '../../models/cart.model.js';
import { generateAccessToken } from '../../utils/jwt.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('User Model', () => {
  it('creates a user with hashed password', async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'Password@123',
    });
    expect(user.name).toBe('Test User');
    expect(user.password).not.toBe('Password@123');
    expect(user.role).toBe('user');
  });

  it('generates access token', async () => {
    const user = await User.create({
      name: 'Test',
      email: 'test@test.com',
      password: 'Password@123',
    });
    const token = generateAccessToken(user);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('compares password correctly', async () => {
    const user = await User.create({
      name: 'Test',
      email: 'test@test.com',
      password: 'Password@123',
    });
    expect(await user.isPasswordCorrect('Password@123')).toBe(true);
    expect(await user.isPasswordCorrect('wrong')).toBe(false);
  });

  it('does not hash password if not modified', async () => {
    const user = await User.create({
      name: 'Test',
      email: 'test@test.com',
      password: 'Password@123',
    });
    const hash = user.password;
    user.name = 'Updated';
    await user.save();
    expect(user.password).toBe(hash);
  });

  it('enforces unique email', async () => {
    await User.create({ name: 'A', email: 'dup@test.com', password: 'Password@1' });
    await expect(
      User.create({ name: 'B', email: 'dup@test.com', password: 'Password@2' }),
    ).rejects.toThrow();
  });

  it('defaults isActive to true', async () => {
    const user = await User.create({ name: 'T', email: 't@t.com', password: 'Password@1' });
    expect(user.isActive).toBe(true);
  });
});

describe('Category Model', () => {
  it('auto-generates slug from name', async () => {
    const cat = await Category.create({ name: 'Street Wear' });
    expect(cat.slug).toBe('street-wear');
  });

  it('enforces unique name', async () => {
    await Category.create({ name: 'Clothing' });
    await expect(Category.create({ name: 'Clothing' })).rejects.toThrow();
  });
});

describe('Subcategory Model', () => {
  it('creates subcategory linked to category', async () => {
    const cat = await Category.create({ name: 'Clothing' });
    const sub = await Subcategory.create({ name: 'T-Shirts', category: cat._id });
    expect(sub.category.toString()).toBe(cat._id.toString());
  });
});

describe('Product Model', () => {
  let user, category, subcategory;

  beforeEach(async () => {
    user = await User.create({
      name: 'Seller',
      email: 'seller@test.com',
      password: 'Password@1',
      role: 'seller',
    });
    category = await Category.create({ name: 'Clothing' });
    subcategory = await Subcategory.create({ name: 'T-Shirts', category: category._id });
  });

  it('creates product with auto-generated slug and productCode', async () => {
    const product = await Product.create({
      title: 'Test Shirt',
      description: 'A test shirt',
      price: 999,
      stock: 10,
      image: '/assets/test.jpg',
      category: category._id,
      subcategory: subcategory._id,
      seller: user._id,
      productCode: 'TS-001',
    });
    expect(product.slug).toBe('test-shirt');
    expect(product.productCode).toBe('TS-001');
  });

  it('rejects discountedPrice >= price', async () => {
    await expect(
      Product.create({
        title: 'Bad Price',
        description: 'Test',
        price: 100,
        discountedPrice: 150,
        image: '/test.jpg',
        category: category._id,
        subcategory: subcategory._id,
        seller: user._id,
        productCode: 'BP-001',
      }),
    ).rejects.toThrow();
  });

  it('accepts valid discountedPrice', async () => {
    const product = await Product.create({
      title: 'Sale Item',
      description: 'Test',
      price: 1000,
      discountedPrice: 800,
      image: '/test.jpg',
      category: category._id,
      subcategory: subcategory._id,
      seller: user._id,
      productCode: 'SI-001',
    });
    expect(product.discountedPrice).toBe(800);
  });

  it('handles duplicate slugs with counter', async () => {
    await Product.create({
      title: 'Shirt',
      description: 'A',
      price: 100,
      image: '/a.jpg',
      category: category._id,
      subcategory: subcategory._id,
      seller: user._id,
      productCode: 'A-1',
    });
    const p2 = await Product.create({
      title: 'Shirt',
      description: 'B',
      price: 200,
      image: '/b.jpg',
      category: category._id,
      subcategory: subcategory._id,
      seller: user._id,
      productCode: 'B-2',
    });
    expect(p2.slug).toMatch(/^shirt-\d+$/);
  });
});

describe('Variant Model', () => {
  let product, user, category, subcategory;

  beforeEach(async () => {
    user = await User.create({
      name: 'S',
      email: 's@t.com',
      password: 'Password@1',
      role: 'seller',
    });
    category = await Category.create({ name: 'Clothing' });
    subcategory = await Subcategory.create({ name: 'Tees', category: category._id });
    product = await Product.create({
      title: 'Variant Test',
      description: 'Test',
      price: 500,
      image: '/t.jpg',
      category: category._id,
      subcategory: subcategory._id,
      seller: user._id,
      productCode: 'VT-1',
    });
  });

  it('creates variant with SKU and optionValues', async () => {
    const variant = await Variant.create({
      product: product._id,
      sku: 'VT-RED-M',
      stock: 10,
      optionValues: new Map([
        ['Color', 'Red'],
        ['Size', 'M'],
      ]),
    });
    expect(variant.sku).toBe('VT-RED-M');
    expect(variant.optionValues.get('Color')).toBe('Red');
  });

  it('enforces unique SKU', async () => {
    await Variant.create({ product: product._id, sku: 'DUP-SKU', stock: 5 });
    await expect(
      Variant.create({ product: product._id, sku: 'DUP-SKU', stock: 3 }),
    ).rejects.toThrow();
  });

  it('findByProductAndOptions returns matching variant', async () => {
    await Variant.create({
      product: product._id,
      sku: 'FIND-ME',
      stock: 5,
      optionValues: new Map([
        ['Color', 'Blue'],
        ['Size', 'L'],
      ]),
    });
    const found = await Variant.findByProductAndOptions(product._id, { Color: 'Blue', Size: 'L' });
    expect(found).not.toBeNull();
    expect(found.sku).toBe('FIND-ME');
  });

  it('findActiveByProduct excludes deleted variants', async () => {
    await Variant.create({ product: product._id, sku: 'ACTIVE-1', stock: 5 });
    await Variant.create({
      product: product._id,
      sku: 'DELETED-1',
      stock: 5,
      deletedAt: new Date(),
    });
    const active = await Variant.findActiveByProduct(product._id);
    expect(active.length).toBe(1);
    expect(active[0].sku).toBe('ACTIVE-1');
  });
});

describe('Order Model', () => {
  it('creates order with all required fields', async () => {
    const user = await User.create({ name: 'C', email: 'c@t.com', password: 'Password@1' });
    const order = await Order.create({
      orderNumber: 'BL-TEST-001',
      user: user._id,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          title: 'Test Product',
          price: 500,
          quantity: 1,
          unitPrice: 500,
          subtotal: 500,
        },
      ],
      subtotal: 500,
      total: 500,
      shippingAddress: {
        fullName: 'Test User',
        phone: '9876543210',
        street: '123 Main St',
        city: 'Mumbai',
        state: 'MH',
        zipCode: '400001',
      },
    });
    expect(order.orderNumber).toBe('BL-TEST-001');
    expect(order.status).toBe('pending');
    expect(order.paymentStatus).toBe('pending');
  });

  it('enforces unique orderNumber', async () => {
    const user = await User.create({ name: 'D', email: 'd@t.com', password: 'Password@1' });
    const item = {
      product: new mongoose.Types.ObjectId(),
      title: 'X',
      price: 100,
      quantity: 1,
      unitPrice: 100,
      subtotal: 100,
    };
    const addr = {
      fullName: 'T',
      phone: '9876543210',
      street: 'S',
      city: 'C',
      state: 'S',
      zipCode: '400001',
    };
    await Order.create({
      orderNumber: 'DUP-001',
      user: user._id,
      items: [item],
      subtotal: 100,
      total: 100,
      shippingAddress: addr,
    });
    await expect(
      Order.create({
        orderNumber: 'DUP-001',
        user: user._id,
        items: [item],
        subtotal: 100,
        total: 100,
        shippingAddress: addr,
      }),
    ).rejects.toThrow();
  });
});

describe('Coupon Model', () => {
  it('creates coupon with auto uppercase code', async () => {
    const coupon = await Coupon.create({
      code: 'save10',
      discountType: 'percentage',
      discountValue: 10,
    });
    expect(coupon.code).toBe('SAVE10');
  });

  it('enforces unique code', async () => {
    await Coupon.create({ code: 'UNIQUE', discountType: 'flat', discountValue: 50 });
    await expect(
      Coupon.create({ code: 'UNIQUE', discountType: 'flat', discountValue: 25 }),
    ).rejects.toThrow();
  });

  it('defaults isActive to true', async () => {
    const coupon = await Coupon.create({
      code: 'ACTIVE',
      discountType: 'percentage',
      discountValue: 5,
    });
    expect(coupon.isActive).toBe(true);
  });

  it('defaults perUserLimit to 1', async () => {
    const coupon = await Coupon.create({ code: 'LIMIT', discountType: 'flat', discountValue: 10 });
    expect(coupon.perUserLimit).toBe(1);
  });
});

describe('Cart Model', () => {
  it('creates one cart per user', async () => {
    const user = await User.create({ name: 'Cart', email: 'cart@t.com', password: 'Password@1' });
    const product = new mongoose.Types.ObjectId();
    await Cart.create({ user: user._id, items: [{ product, quantity: 1 }] });
    await expect(
      Cart.create({ user: user._id, items: [{ product, quantity: 2 }] }),
    ).rejects.toThrow();
  });
});
