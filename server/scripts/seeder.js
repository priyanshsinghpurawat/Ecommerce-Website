import mongoose from 'mongoose';
import fs from 'fs';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';
import { Variant } from '../models/variant.model.js';
dotenv.config();

// No static catalog — use --csv path for data import

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * CSV IMPORT LOGIC (Consolidated from csvImport.controller)
 */
const importFromCSV = async (csvPath, adminUser) => {
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    console.error('CSV Parse Errors:', parsed.errors);
    return;
  }

  const rows = parsed.data;
  let createdCount = 0;
  let updatedCount = 0;
  const errors = [];
  const catCache = new Map();
  const subCache = new Map();

  console.log(`Processing ${rows.length} rows from CSV...`);

  for (const [index, row] of rows.entries()) {
    try {
      const {
        title,
        description,
        price,
        discountedPrice,
        category,
        subcategory,
        stock,
        badge,
        variant_color,
        variant_size,
        variant_stock,
        variant_price,
        image,
      } = row;

      if (!title || !price || !category || !subcategory) {
        errors.push(`Row ${index + 2}: Missing required fields`);
        continue;
      }

      // Resolve Category
      let catId = catCache.get(category.trim().toLowerCase());
      if (!catId) {
        let catDoc = await Category.findOne({
          name: new RegExp(`^${escapeRegex(category.trim())}$`, 'i'),
        });
        if (!catDoc) {
          catDoc = await Category.create({ name: category.trim() });
        }
        catId = catDoc._id;
        catCache.set(category.trim().toLowerCase(), catId);
      }

      // Resolve Subcategory
      let subId = subCache.get(`${catId}_${subcategory.trim().toLowerCase()}`);
      if (!subId) {
        let subDoc = await Subcategory.findOne({
          name: new RegExp(`^${escapeRegex(subcategory.trim())}$`, 'i'),
          category: catId,
        });
        if (!subDoc) {
          subDoc = await Subcategory.create({ name: subcategory.trim(), category: catId });
        }
        subId = subDoc._id;
        subCache.set(`${catId}_${subcategory.trim().toLowerCase()}`, subId);
      }

      let product = await Product.findOne({ title: title.trim(), seller: adminUser._id });

      const variant =
        variant_color || variant_size
          ? {
              color: variant_color ? variant_color.trim() : '',
              size: variant_size ? variant_size.trim() : '',
              stock: variant_stock ? Number(variant_stock) : 0,
              price: variant_price ? Number(variant_price) : null,
            }
          : null;

      if (product) {
        product.price = Number(price);
        await product.save();

        if (variant) {
          const existingVariant = await Variant.findOne({
            product: product._id,
            'optionValues.Color': variant.color,
            'optionValues.Size': variant.size,
            deletedAt: null,
          });

          if (existingVariant) {
            existingVariant.stock = variant.stock;
            if (variant.price) existingVariant.price = variant.price;
            await existingVariant.save();
          } else {
            const sku = [product.productCode, variant.color, variant.size]
              .filter(Boolean)
              .join('-')
              .toUpperCase();
            await Variant.create({
              product: product._id,
              sku,
              stock: variant.stock,
              price: variant.price || product.discountedPrice || product.price,
              optionValues: { Color: variant.color, Size: variant.size },
              status: 'active',
            });
          }
        }

        updatedCount++;
      } else {
        const newProduct = await Product.create({
          title: title.trim(),
          description: description || 'Imported from CSV',
          price: Number(price),
          discountedPrice: discountedPrice ? Number(discountedPrice) : null,
          category: catId,
          subcategory: subId,
          stock: stock ? Number(stock) : 10,
          badge: badge || '',
          seller: adminUser._id,
          gender: 'men',
          image: image || '',
        });

        if (variant) {
          const sku = [newProduct.productCode, variant.color, variant.size]
            .filter(Boolean)
            .join('-')
            .toUpperCase();
          await Variant.create({
            product: newProduct._id,
            sku,
            stock: variant.stock,
            price: variant.price || newProduct.discountedPrice || newProduct.price,
            optionValues: { Color: variant.color, Size: variant.size },
            status: 'active',
          });
        }

        createdCount++;
      }
    } catch (err) {
      errors.push(`Row ${index + 2}: ${err.message}`);
    }
  }
  console.log(
    `CSV Import Result: ${createdCount} created, ${updatedCount} updated. Errors: ${errors.length}`,
  );
  if (errors.length) console.log('Sample errors:', errors.slice(0, 5));
};

/**
 * THE MAIN SEED FUNCTION
 */
const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e-commerce';

    await mongoose.connect(mongoUri);
    console.log(`Connected to DB.`);

    const args = process.argv.slice(2);
    const csvIndex = args.indexOf('--csv');

    if (csvIndex === -1 || !args[csvIndex + 1]) {
      console.log('Usage: node scripts/seeder.js --csv <path-to-csv>');
      console.log('This tool only imports from CSV. No destructive operations are performed.');
      process.exit(0);
    }

    const csvPath = args[csvIndex + 1];
    console.log(`Starting CSV import from ${csvPath}...`);

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found. Creating a temporary one for import...');
      admin = await User.create({
        name: 'Import Admin',
        email: 'import-admin@mensvibe.in',
        password: 'StrongP@ss123!',
        role: 'admin',
      });
    }

    await importFromCSV(csvPath, admin);
    console.log('CSV Import done.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
