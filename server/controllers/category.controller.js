import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';
import { getCache, setCache, clearCacheByPattern } from '../utils/cache.js';

/**
 * @desc    Create a new category (Admin Only)
 * @route   POST /api/v1/categories
 * @access  Private/Admin
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  // Check duplicate category name
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new ApiError(409, `Category '${name}' already exists.`);
  }

  // Pre-save hook handles slugification
  const category = await Category.create({ name });

  // Invalidate category cache
  await clearCacheByPattern('categories:');

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

/**
 * @desc    Get all categories (Public)
 * @route   GET /api/v1/categories
 * @access  Public
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const cacheKey = 'categories:all';
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return res
      .status(200)
      .json(new ApiResponse(200, cachedData, "Categories retrieved successfully (cached)"));
  }

  const categories = await Category.find({}).sort({ createdAt: -1 });

  // Cache categories for 60 seconds
  await setCache(cacheKey, categories, 60);

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories retrieved successfully"));
});

/**
 * @desc    Get category details by slug (Public)
 * @route   GET /api/v1/categories/:slug
 * @access  Public
 */
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug });
  if (!category) {
    throw new ApiError(404, `Category with slug '${slug}' not found.`);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category retrieved successfully"));
});

/**
 * @desc    Update category (Admin Only)
 * @route   PUT /api/v1/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Update name (saving document will re-trigger pre-save slugification hook)
  category.name = name;
  await category.save();

  // Invalidate category cache
  await clearCacheByPattern('categories:');

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

/**
 * @desc    Delete category (Admin Only)
 * @route   DELETE /api/v1/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Delete associated subcategories
  await Subcategory.deleteMany({ category: id });

  await Category.findByIdAndDelete(id);

  // Invalidate category cache
  await clearCacheByPattern('categories:');

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Category and its subcategories deleted successfully"));
});
