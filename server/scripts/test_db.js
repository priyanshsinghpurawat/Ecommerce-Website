import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';

dotenv.config();

const test = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e-commerce';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected!');
    
    console.log('Finding product...');
    const prod = await Product.findById('6a12b6c4751521403ef35d86').populate("category", "name slug");
    console.log('Found product:', prod);
    process.exit(0);
  } catch (err) {
    console.error('Error occurred:', err);
    process.exit(1);
  }
};

test();
