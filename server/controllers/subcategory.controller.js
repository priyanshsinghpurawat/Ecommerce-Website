import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { getCache, setCache } from '../utils/cache.js';

export const getSubcategories = asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  const cacheKey = `subcategories:cat=${category || 'all'}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, 'OK (cached)'));
  }

  const filter = category ? { category } : {};
  let subcategories = await Subcategory.find(filter)
    .populate('category', 'name slug')
    .sort({ name: 1 })
    .lean();

  // Attach a product image to each subcategory
  const subcategoryIds = subcategories.map(s => s._id);
  
  const productImages = await Product.aggregate([
    { $match: { subcategory: { $in: subcategoryIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$subcategory", image: { $first: "$image" }, images: { $first: "$images" } } }
  ]);

  const imageMap = {};
  productImages.forEach(p => {
    imageMap[p._id.toString()] = p.image || (p.images && p.images[0]) || null;
  });

  subcategories = subcategories.map(sub => ({
    ...sub,
    image: imageMap[sub._id.toString()] || null
  }));

  // Cache subcategories for 1 hour (3600 seconds)
  setCache(cacheKey, subcategories, 3600);

  return res.status(200).json(new ApiResponse(200, subcategories, 'OK'));
});

export const createSubcategory = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json(new ApiResponse(400, null, 'Name and category are required'));
  }
  
  const subcategory = await Subcategory.create({ name, category });
  const cacheKey = `subcategories:cat=${category}`;
  const allCacheKey = 'subcategories:cat=all';
  setCache(cacheKey, null, 0); // clear cache
  setCache(allCacheKey, null, 0);

  return res.status(201).json(new ApiResponse(201, subcategory, 'Subcategory created'));
});

export const updateSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;
  
  const subcategory = await Subcategory.findById(id);
  if (!subcategory) {
    return res.status(404).json(new ApiResponse(404, null, 'Subcategory not found'));
  }

  // Clear cache for old and new category
  setCache(`subcategories:cat=${subcategory.category}`, null, 0);
  if (category) {
    setCache(`subcategories:cat=${category}`, null, 0);
  }
  setCache('subcategories:cat=all', null, 0);

  if (name) subcategory.name = name;
  if (category) subcategory.category = category;
  
  await subcategory.save();
  return res.status(200).json(new ApiResponse(200, subcategory, 'Subcategory updated'));
});

export const deleteSubcategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subcategory = await Subcategory.findByIdAndDelete(id);
  
  if (!subcategory) {
    return res.status(404).json(new ApiResponse(404, null, 'Subcategory not found'));
  }

  setCache(`subcategories:cat=${subcategory.category}`, null, 0);
  setCache('subcategories:cat=all', null, 0);

  return res.status(200).json(new ApiResponse(200, null, 'Subcategory deleted'));
});

