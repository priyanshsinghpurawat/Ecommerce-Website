import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { ProductRepository } from '../../repositories/product.repository.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Product } from '../../models/product.model.js';
import { User } from '../../models/user.model.js';
import { Category } from '../../models/category.model.js';
import { Subcategory } from '../../models/subcategory.model.js';

let mongod, user, category, subcategory;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  user = await User.create({ name: 'S', email: 'repo@test.com', password: 'Password@1', role: 'seller' });
  category = await Category.create({ name: 'Repo Category' });
  subcategory = await Subcategory.create({ name: 'Repo Sub', category: category._id });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Product.deleteMany({});
});

const makeProduct = (overrides = {}) => ({
  title: 'Repo Test',
  description: 'A test product for repository',
  price: 999,
  stock: 10,
  image: '/test.jpg',
  category: category._id,
  subcategory: subcategory._id,
  seller: user._id,
  productCode: `RC-${Date.now()}`,
  ...overrides
});

describe('ProductRepository', () => {
  it('create() saves product to database', async () => {
    const product = await ProductRepository.create(makeProduct());
    expect(product._id).toBeDefined();
    expect(product.title).toBe('Repo Test');
  });

  it('findById() returns product by id', async () => {
    const created = await ProductRepository.create(makeProduct());
    const found = await ProductRepository.findById(created._id);
    expect(found.title).toBe('Repo Test');
  });

  it('findByIdOrSlug() finds by slug', async () => {
    const created = await ProductRepository.create(makeProduct({ title: 'Slug Test' }));
    const found = await ProductRepository.findByIdOrSlug('slug-test');
    expect(found._id.toString()).toBe(created._id.toString());
  });

  it('findByIdOrSlug() finds by ObjectId', async () => {
    const created = await ProductRepository.create(makeProduct());
    const found = await ProductRepository.findByIdOrSlug(created._id.toString());
    expect(found.title).toBe('Repo Test');
  });

  it('findOne() returns single product', async () => {
    await ProductRepository.create(makeProduct());
    const found = await ProductRepository.findOne({ title: 'Repo Test' });
    expect(found).not.toBeNull();
  });

  it('find() returns products with sort/skip/limit', async () => {
    await ProductRepository.create(makeProduct({ title: 'A', productCode: 'A-1' }));
    await ProductRepository.create(makeProduct({ title: 'B', productCode: 'B-2' }));
    await ProductRepository.create(makeProduct({ title: 'C', productCode: 'C-3' }));
    const results = await ProductRepository.find({}, { limit: 2, skip: 1, sort: { title: 1 } });
    expect(results.length).toBe(2);
  });

  it('countDocuments() returns count', async () => {
    await ProductRepository.create(makeProduct({ productCode: 'CD-1' }));
    await ProductRepository.create(makeProduct({ productCode: 'CD-2' }));
    const count = await ProductRepository.countDocuments({});
    expect(count).toBe(2);
  });

  it('distinct() returns unique values', async () => {
    await ProductRepository.create(makeProduct({ productCode: 'D1' }));
    await ProductRepository.create(makeProduct({ productCode: 'D2' }));
    const titles = await ProductRepository.distinct('title');
    expect(titles.length).toBe(1);
  });

  it('findByIdAndUpdate() updates and returns new doc', async () => {
    const created = await ProductRepository.create(makeProduct());
    const updated = await ProductRepository.findByIdAndUpdate(created._id, { title: 'Updated' });
    expect(updated.title).toBe('Updated');
  });

  it('findByIdAndDelete() removes product', async () => {
    const created = await ProductRepository.create(makeProduct());
    await ProductRepository.findByIdAndDelete(created._id);
    const found = await ProductRepository.findById(created._id);
    expect(found).toBeNull();
  });
});
