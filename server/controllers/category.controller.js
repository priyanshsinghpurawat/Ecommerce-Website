import { Category } from '../models/category.model.js';
import { Subcategory } from '../models/subcategory.model.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';

/**
 * @desc    Create a new category (Admin Only)
 * @route   POST /api/v3/categories
 * @access  Private/Admin
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, 'Category name is required');
  }

  // Check duplicate category name
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new ApiError(409, `Category '${name}' already exists.`);
  }

  // Pre-save hook handles slugification
  const category = await Category.create({ name });

  return res.status(201).json(new ApiResponse(201, category, 'Category created successfully'));
});

/**
 * @desc    Get all categories (Public)
 * @route   GET /api/v3/categories
 * @access  Public
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).sort({ createdAt: -1 }).lean();

  return res
    .status(200)
    .json(new ApiResponse(200, categories, 'Categories retrieved successfully'));
});

/**
 * @desc    Get category details by slug (Public)
 * @route   GET /api/v3/categories/:slug
 * @access  Public
 */
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findOne({ slug }).lean();
  if (!category) {
    throw new ApiError(404, `Category with slug '${slug}' not found.`);
  }

  return res.status(200).json(new ApiResponse(200, category, 'Category retrieved successfully'));
});

/**
 * @desc    Update category (Admin Only)
 * @route   PUT /api/v3/categories/:id
 * @access  Private/Admin
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, 'Category name is required');
  }

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Update name (saving document will re-trigger pre-save slugification hook)
  category.name = name;
  await category.save();

  return res.status(200).json(new ApiResponse(200, category, 'Category updated successfully'));
});

/**
 * @desc    Delete category (Admin Only)
 * @route   DELETE /api/v3/categories/:id
 * @access  Private/Admin
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Delete associated subcategories
  await Subcategory.deleteMany({ category: id });

  await Category.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Category and its subcategories deleted successfully'));
});
