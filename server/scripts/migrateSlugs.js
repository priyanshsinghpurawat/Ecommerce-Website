import mongoose from 'mongoose';
import dotenv from 'dotenv';
import slugify from 'slugify';
import { Product } from '../models/product.model.js';

dotenv.config();

const migrateSlugs = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e-commerce';
    await mongoose.connect(mongoUri);
    console.log('Connected to DB. Starting Slug Migration...');

    const products = await Product.find({ slug: { $exists: false } });
    console.log(`Found ${products.length} products without a slug.`);

    let successCount = 0;
    for (const product of products) {
      if (product.title) {
        let baseSlug = slugify(product.title, { lower: true, strict: true });
        let newSlug = baseSlug;
        let isUnique = false;

        while (!isUnique) {
          const existing = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
          if (!existing) {
            isUnique = true;
          } else {
            newSlug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
          }
        }

        product.slug = newSlug;
        // Using updateOne to avoid triggering full validation/pre-save if not needed, 
        // but since we want the new schema to apply, we can just save it.
        // Wait, pre-save hook will handle it if we do product.save(), but let's just do updateOne 
        // to be safe against strict validations that might fail on old data.
        await Product.updateOne({ _id: product._id }, { $set: { slug: newSlug } });
        successCount++;
        console.log(`Migrated: ${product.title} -> ${newSlug}`);
      }
    }

    console.log(`Migration complete. Successfully migrated ${successCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateSlugs();
