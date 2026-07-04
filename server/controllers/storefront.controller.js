import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';

/**
 * @desc    Get public seller storefront data by slug
 * @route   GET /api/v3/users/store/:slug
 * @access  Public
 */
export const getPublicSellerStore = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  // Find seller by storefront slug
  const seller = await User.findOne({
    'storefront.slug': slug.toLowerCase(),
    role: 'seller',
    isActive: true,
  }).select('brandName storefront avatar createdAt');

  if (!seller) {
    throw new ApiError(404, 'Storefront not found');
  }

  // Fetch their active published products
  const products = await Product.find({ seller: seller._id, status: 'published' })
    .sort({ createdAt: -1 })
    .limit(100);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        seller,
        products,
      },
      'Storefront retrieved successfully',
    ),
  );
});
