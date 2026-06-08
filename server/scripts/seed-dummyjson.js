import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';

dotenv.config();

const seedFromDummyJson = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e-commerce';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Fetching products from DummyJSON...');
    const response = await axios.get('https://dummyjson.com/products?limit=30');
    const dummyProducts = response.data.products;

    console.log(`Fetched ${dummyProducts.length} products. Seeding to database...`);

    for (const p of dummyProducts) {
      // Find or create Category
      let category = await Category.findOne({ name: p.category });
      if (!category) {
        category = await Category.create({ name: p.category });
      }

      // Find or create Subcategory (using the same name for simplicity if DummyJSON doesn't have subs)
      let subcategory = await Subcategory.findOne({ name: `${p.category} General`, category: category._id });
      if (!subcategory) {
        subcategory = await Subcategory.create({ name: `${p.category} General`, category: category._id });
      }

      // Calculate discounted price
      const discountAmount = (p.price * (p.discountPercentage || 0)) / 100;
      const discountedPrice = Math.max(0, p.price - discountAmount);

      // Create Product
      await Product.create({
        title: p.title.substring(0, 120),
        description: p.description,
        price: p.price,
        discountedPrice: discountedPrice < p.price ? discountedPrice : null,
        stock: p.stock > 0 ? p.stock : 10,
        image: p.thumbnail || p.images[0],
        category: category._id,
        subcategory: subcategory._id,
        rating: p.rating || 0,
        reviewCount: p.reviews?.length || Math.floor(Math.random() * 50)
      });
    }

    console.log('Successfully seeded products from DummyJSON!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedFromDummyJson();
