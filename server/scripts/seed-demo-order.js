import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const createDemoOrder = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // 1. Find or create a demo user
    let user = await User.findOne({ email: 'admin@mensvibe.in' });
    if (!user) {
      console.log('Creating demo admin...');
      user = await User.create({
        name: 'Demo Admin',
        email: 'admin@mensvibe.in',
        password: 'StrongP@ss123!',
        role: 'admin'
      });
    }

    // 2. Find a product
    const product = await Product.findOne();
    if (!product) {
      console.log('No products found to create demo order. Run seeder first.');
      process.exit(0);
    }

    // 3. Create Demo Order
    const unitPrice = product.discountedPrice || product.price;
    const quantity = 2;

    const demoOrder = new Order({
      user: user._id,
      orderNumber: 'MV-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: [{
        product: product._id,
        title: product.title,
        quantity: quantity,
        price: product.price,
        unitPrice: unitPrice,
        subtotal: unitPrice * quantity
      }],
      subtotal: unitPrice * quantity,
      discountAmount: 0,
      total: unitPrice * quantity,
      shippingAddress: {
        fullName: 'John Doe',
        street: '123 Fashion Street',
        city: 'Jaipur',
        state: 'Rajasthan',
        zipCode: '302001',
        phone: '9876543210'
      },
      paymentStatus: 'paid',
      status: 'confirmed'
    });

    await demoOrder.save();
    console.log('Demo order created successfully:', demoOrder.orderNumber);
    process.exit(0);
  } catch (err) {
    console.error('Error creating demo order:', err.message);
    process.exit(1);
  }
};

createDemoOrder();