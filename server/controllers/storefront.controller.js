import { User } from '../models/user.model.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';

/**
 * @desc    Get public vendor storefront data by slug
 * @route   GET /api/v3/users/store/:slug
 * @access  Public
 */
export const getPublicVendorStore = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Find vendor by storefront slug
  const vendor = await User.findOne({ 'storefront.slug': slug.toLowerCase(), role: 'seller', isActive: true })
    .select('brandName storefront avatar createdAt');

  if (!vendor) {
    throw new ApiError(404, 'Storefront not found');
  }

  // Fetch their active published products
  const products = await ProductRepository.find(
    { seller: vendor._id, status: 'published' },
    { sort: { createdAt: -1 }, limit: 100 }
  );

  return res.status(200).json(new ApiResponse(200, {
    vendor,
    products
  }, 'Storefront retrieved successfully'));
});
