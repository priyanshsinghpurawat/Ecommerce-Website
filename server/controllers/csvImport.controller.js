import Papa from 'papaparse';
import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export const bulkImportFromCSV = asyncHandler(async (req, res) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    throw new ApiError(400, 'No CSV file uploaded');
  }

  const file = req.file || (req.files && req.files[0]);
  if (!file.originalname.endsWith('.csv')) {
    throw new ApiError(400, 'Only CSV files are allowed');
  }

  const csvText = file.buffer.toString('utf-8');
  
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new ApiError(400, 'Failed to parse CSV', parsed.errors);
  }

  const rows = parsed.data;
  let createdCount = 0;
  let updatedCount = 0;
  const errors = [];

  // Map to cache category/subcategory lookups to avoid excessive DB calls
  const catCache = new Map();
  const subCache = new Map();

  for (const [index, row] of rows.entries()) {
    try {
      const {
        title, description, price, discountedPrice, category, subcategory,
        stock, badge, variant_color, variant_size, variant_stock, variant_price, image
      } = row;

      if (!title || !price || !category || !subcategory) {
        errors.push(`Row ${index + 2}: Missing required fields (title, price, category, subcategory)`);
        continue;
      }

      // Resolve Category
      let catId = catCache.get(category.trim().toLowerCase());
      if (!catId) {
        const catDoc = await Category.findOne({ name: new RegExp(`^${category.trim()}$`, 'i') });
        if (!catDoc) {
          errors.push(`Row ${index + 2}: Category '${category}' not found`);
          continue;
        }
        catId = catDoc._id;
        catCache.set(category.trim().toLowerCase(), catId);
      }

      // Resolve Subcategory
      let subId = subCache.get(`${catId}_${subcategory.trim().toLowerCase()}`);
      if (!subId) {
        const subDoc = await Subcategory.findOne({ 
          name: new RegExp(`^${subcategory.trim()}$`, 'i'),
          category: catId 
        });
        if (!subDoc) {
          errors.push(`Row ${index + 2}: Subcategory '${subcategory}' not found in category '${category}'`);
          continue;
        }
        subId = subDoc._id;
        subCache.set(`${catId}_${subcategory.trim().toLowerCase()}`, subId);
      }

      // Check if product already exists to update it, or create new
      let product = await Product.findOne({ title: title.trim(), seller: req.user._id });

      const variant = (variant_color || variant_size) ? {
        color: variant_color ? variant_color.trim() : '',
        size: variant_size ? variant_size.trim() : '',
        stock: variant_stock ? Number(variant_stock) : 0,
        price: variant_price ? Number(variant_price) : null,
      } : null;

      if (product) {
        // Update existing product
        product.description = description || product.description;
        product.price = Number(price);
        product.discountedPrice = discountedPrice ? Number(discountedPrice) : product.discountedPrice;
        product.stock = stock ? Number(stock) : product.stock;
        product.badge = badge || product.badge;
        product.category = catId;
        product.subcategory = subId;
        if (image && !product.image) product.image = image.trim();

        // Add variant if it doesn't exist
        if (variant) {
          const existingVarIndex = product.variants.findIndex(v => v.color === variant.color && v.size === variant.size);
          if (existingVarIndex >= 0) {
            product.variants[existingVarIndex].stock = variant.stock;
            if (variant.price) product.variants[existingVarIndex].price = variant.price;
          } else {
            product.variants.push(variant);
          }
        }
        await product.save();
        updatedCount++;
      } else {
        // Create new product
        const newProduct = new Product({
          title: title.trim(),
          description: description ? description.trim() : 'Imported from CSV',
          price: Number(price),
          discountedPrice: discountedPrice ? Number(discountedPrice) : null,
          category: catId,
          subcategory: subId,
          stock: stock ? Number(stock) : 10,
          badge: badge ? badge.trim() : '',
          seller: req.user._id,
          gender: 'men',
          image: image ? image.trim() : '',
          variants: variant ? [variant] : []
        });
        await newProduct.save();
        createdCount++;
      }
    } catch (err) {
      errors.push(`Row ${index + 2}: ${err.message}`);
    }
  }

  return res.status(200).json(new ApiResponse(200, { createdCount, updatedCount, errors }, 'CSV bulk import completed'));
});
