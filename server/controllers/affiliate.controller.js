import { AffiliateLink } from '../models/affiliateLink.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';

/**
 * @desc    Generate a new affiliate tracking link
 * @route   POST /api/v3/affiliates/generate
 * @access  Private/Seller
 */
export const generateAffiliateLink = asyncHandler(async (req, res) => {
  const { campaignName, productId } = req.body;
  const vendorId = req.user._id;

  if (!campaignName) {
    throw new ApiError(400, 'Campaign name is required');
  }

  // Generate a unique tag: vendorId(short) + random string
  const shortId = vendorId.toString().substring(18, 24);
  const randomStr = Math.random().toString(36).substring(2, 8);
  const trackingTag = `${shortId}-${randomStr}`.toLowerCase();

  let targetUrl;

  if (productId) {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, 'Product not found');
    targetUrl = `/product/${product._id}`;
  } else {
    // If no product, maybe point to their storefront
    targetUrl = `/store/${req.user.storefront?.slug || vendorId}`;
  }

  // Append the tag to the URL for easy copying
  const fullUrl = `${targetUrl}?ref=${trackingTag}`;

  const link = await AffiliateLink.create({
    vendor: vendorId,
    targetProduct: productId || null,
    targetUrl: fullUrl,
    trackingTag,
    campaignName,
  });

  return res.status(201).json(new ApiResponse(201, link, 'Tracking link generated successfully'));
});

/**
 * @desc    Get all affiliate links for logged in seller
 * @route   GET /api/v3/affiliates
 * @access  Private/Seller
 */
export const getMyAffiliateLinks = asyncHandler(async (req, res) => {
  const links = await AffiliateLink.find({ vendor: req.user._id })
    .populate('targetProduct', 'title image')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, links, 'Links retrieved successfully'));
});

/**
 * @desc    Track a click on an affiliate link (Public endpoint called by middleware/frontend)
 * @route   POST /api/v3/affiliates/track/:tag
 * @access  Public
 */
export const trackClick = asyncHandler(async (req, res) => {
  const { tag } = req.params;

  const link = await AffiliateLink.findOneAndUpdate(
    { trackingTag: tag.toLowerCase(), isActive: true },
    { $inc: { 'metrics.clicks': 1 } },
    { new: true },
  );

  if (!link) {
    return res.status(200).json(new ApiResponse(200, null, 'Invalid or inactive tag'));
  }

  return res.status(200).json(new ApiResponse(200, null, 'Click tracked'));
});

/**
 * @desc    Delete an affiliate tracking link
 * @route   DELETE /api/v3/affiliates/:id
 * @access  Private/Seller
 */
export const deleteAffiliateLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const link = await AffiliateLink.findOneAndDelete({ _id: id, vendor: req.user._id });

  if (!link) {
    throw new ApiError(404, "Affiliate link not found or you don't have permission to delete it.");
  }

  return res.status(200).json(new ApiResponse(200, null, 'Affiliate link deleted successfully'));
});
