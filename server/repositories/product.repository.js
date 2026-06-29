import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';

export class ProductRepository {
  static async create(data) {
    return await Product.create(data);
  }

  static async findById(id, populateOpts = [], lean = false) {
    let query = Product.findById(id);
    for (const pop of populateOpts) {
      query = query.populate(pop);
    }
    if (lean) query = query.lean();
    return await query;
  }

  static async findByIdOrSlug(idOrSlug, populateOpts = [], lean = false) {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };
    let query = Product.findOne(filter);
    for (const pop of populateOpts) {
      query = query.populate(pop);
    }
    if (lean) query = query.lean();
    return await query;
  }

  static async findOne(filter, lean = false) {
    let query = Product.findOne(filter);
    if (lean) query = query.lean();
    return await query;
  }

  static async find(filter, { sort = { createdAt: -1 }, skip = 0, limit = 10, populate = [], lean = false } = {}) {
    let query = Product.find(filter).sort(sort).skip(skip).limit(limit);
    for (const pop of populate) {
      query = query.populate(pop);
    }
    if (lean) query = query.lean();
    return await query;
  }

  static async countDocuments(filter) {
    return await Product.countDocuments(filter);
  }

  static async distinct(field, filter = {}) {
    return await Product.distinct(field, filter);
  }

  static async findByIdAndUpdate(id, data, options = { new: true }) {
    return await Product.findByIdAndUpdate(id, data, options);
  }

  static async findByIdAndDelete(id) {
    return await Product.findByIdAndDelete(id);
  }
}
