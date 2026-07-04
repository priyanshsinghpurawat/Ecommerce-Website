import { Review } from '../models/review.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';
import mongoose from 'mongoose';

/**
 * @desc   Get reviews for a product
 * @route  GET /api/v3/products/:id/reviews
 * @access Public
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const filter = isObjectId ? { _id: id } : { slug: id };
  const product = await Product.findOne(filter).lean();
  if (!product) throw new ApiError(404, 'Product not found');

  const reviews = await Review.find({ product: product._id })
    .populate({ path: 'user', select: 'name avatar' })
    .sort({ createdAt: -1 })
    .lean();

  const payload = reviews.map((r) => ({
    _id: r._id,
    name: r.user?.name || 'Anonymous',
    avatar: r.user?.avatar || null,
    rating: r.rating,
    comment: r.comment,
    date: r.createdAt.toISOString().split('T')[0],
    isOwn: req.user?._id?.toString() === r.user?._id?.toString(),
  }));

  return res.status(200).json(new ApiResponse(200, payload, 'Reviews retrieved successfully'));
});

/**
 * @desc   Submit a review
 * @route  POST /api/v3/products/:id/reviews
 * @access Private
 */
export const submitReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const filter = isObjectId ? { _id: id } : { slug: id };
  const product = await Product.findOne(filter).lean();
  if (!product) throw new ApiError(404, 'Product not found');

  const productId = product._id;

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) {
    throw new ApiError(
      409,
      'You have already reviewed this product. You can edit your existing review.',
    );
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating: Number(rating),
    comment: comment.trim(),
  });

  await Review.recalculateProductRating(productId);

  const populated = await Review.findById(review._id)
    .populate({ path: 'user', select: 'name avatar' })
    .lean();

  const payload = {
    _id: populated._id,
    name: populated.user?.name || 'Anonymous',
    avatar: populated.user?.avatar || null,
    rating: populated.rating,
    comment: populated.comment,
    date: populated.createdAt.toISOString().split('T')[0],
    isOwn: true,
  };

  return res.status(201).json(new ApiResponse(201, payload, 'Review submitted successfully'));
});

/**
 * @desc   Delete own review
 * @route  DELETE /api/v3/reviews/:reviewId
 * @access Private
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own reviews');
  }

  const productId = review.product;
  await Review.findByIdAndDelete(reviewId);

  await Review.recalculateProductRating(productId);

  return res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
});
