import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const countAll = await db.collection('products').countDocuments();
  const countWithoutSlug = await db.collection('products').countDocuments({ slug: { $exists: false } });
  const countNullSlug = await db.collection('products').countDocuments({ slug: null });
  const countEmptySlug = await db.collection('products').countDocuments({ slug: '' });
  
  console.log(`Total Products: ${countAll}`);
  console.log(`Products without slug field: ${countWithoutSlug}`);
  console.log(`Products with null slug: ${countNullSlug}`);
  console.log(`Products with empty slug: ${countEmptySlug}`);
  process.exit(0);
}
run();
