import { Subcategory } from '../models/subcategory.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler, ApiResponse } from '../utils/helpers.js';
import { getCache, setCache, deleteCache } from '../utils/cache.js';

export const getSubcategories = asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  const cacheKey = `subcategories:cat=${category || 'all'}`;
  const cachedData = await getCache(cacheKey);

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

  // Cache subcategories for 60 seconds (matching categories)
  await setCache(cacheKey, subcategories, 60);

  return res.status(200).json(new ApiResponse(200, subcategories, 'OK'));
});

export const createSubcategory = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json(new ApiResponse(400, null, 'Name and category are required'));
  }
  
  const subcategory = await Subcategory.create({ name, category });
  await deleteCache(`subcategories:cat=${category}`);
  await deleteCache('subcategories:cat=all');

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
  await deleteCache(`subcategories:cat=${subcategory.category}`);
  if (category) {
    await deleteCache(`subcategories:cat=${category}`);
  }
  await deleteCache('subcategories:cat=all');

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

  await deleteCache(`subcategories:cat=${subcategory.category}`);
  await deleteCache('subcategories:cat=all');

  return res.status(200).json(new ApiResponse(200, null, 'Subcategory deleted'));
});

