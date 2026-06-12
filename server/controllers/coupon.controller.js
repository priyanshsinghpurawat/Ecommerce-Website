import { Coupon } from '../models/coupon.model.js';
import { asyncHandler, ApiError, ApiResponse, calculateCouponDiscount } from '../utils/helpers.js';

/**
 * @desc    Create a new coupon (Admin Only)
 * @route   POST /api/v1/coupons
 * @access  Private/Admin
 */
export const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minCartAmount, expiryDate, usageLimit, perUserLimit, isActive, appliedProducts } = req.body;

  if (!code || !discountType || discountValue === undefined) {
    throw new ApiError(400, "Coupon code, discount type, and discount value are required");
  }

  // Check duplicate coupon code
  const uppercaseCode = code.trim().toUpperCase();
  const existingCoupon = await Coupon.findOne({ code: uppercaseCode });
  if (existingCoupon) {
    throw new ApiError(409, `Coupon with code '${uppercaseCode}' already exists.`);
  }

  const coupon = await Coupon.create({
    code: uppercaseCode,
    discountType,
    discountValue: Number(discountValue),
    minCartAmount: minCartAmount ? Number(minCartAmount) : 0,
    expiryDate: expiryDate || undefined,
    usageLimit: usageLimit !== undefined ? Number(usageLimit) : null,
    perUserLimit: perUserLimit !== undefined ? Number(perUserLimit) : 1,
    isActive: isActive !== undefined ? isActive : true,
    appliedProducts: appliedProducts || [],
    seller: req.user.role === 'seller' ? req.user._id : null
  });

  return res
    .status(201)
    .json(new ApiResponse(201, coupon, "Coupon created successfully"));
});

/**
 * @desc    Get all coupons (Admin Only)
 * @route   GET /api/v1/coupons
 * @access  Private/Admin
 */
export const getAllCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status } = req.query;
  
  const query = {};
  
  // Search by code
  if (search) {
    query.code = { $regex: search, $options: 'i' };
  }
  
  // Filter by status
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;

  // Filter by seller if role is seller
  if (req.user.role === 'seller') {
    query.seller = req.user._id;
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const coupons = await Coupon.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const totalCoupons = await Coupon.countDocuments(query);

  return res
    .status(200)
    .json(new ApiResponse(200, {
      coupons,
      pagination: {
        totalCoupons,
        totalPages: Math.ceil(totalCoupons / limit),
        currentPage: Number(page),
        limit: Number(limit)
      }
    }, "Coupons retrieved successfully"));
});

/**
 * @desc    Update an existing coupon (Admin Only)
 * @route   PUT /api/v1/coupons/:id
 * @access  Private/Admin
 */
export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { code, discountType, discountValue, minCartAmount, expiryDate, usageLimit, perUserLimit, isActive, appliedProducts } = req.body;

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  // Ensure seller can only update their own coupons
  if (req.user.role === 'seller' && coupon.seller?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to modify this coupon");
  }

  if (code) {
    const uppercaseCode = code.trim().toUpperCase();
    // Check if renaming to an existing code of ANOTHER coupon
    const duplicate = await Coupon.findOne({ code: uppercaseCode, _id: { $ne: id } });
    if (duplicate) {
      throw new ApiError(409, `Coupon with code '${uppercaseCode}' already exists.`);
    }
    coupon.code = uppercaseCode;
  }

  if (discountType) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
  if (minCartAmount !== undefined) coupon.minCartAmount = Number(minCartAmount);
  
  // Explicitly handle clearing or setting expiryDate
  if (expiryDate !== undefined) {
    coupon.expiryDate = expiryDate || undefined;
  }

  if (usageLimit !== undefined) coupon.usageLimit = usageLimit === '' ? null : Number(usageLimit);
  if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit === '' ? 1 : Number(perUserLimit);
  
  if (isActive !== undefined) coupon.isActive = isActive;
  if (appliedProducts !== undefined) coupon.appliedProducts = appliedProducts;

  await coupon.save();

  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon updated successfully"));
});

/**
 * @desc    Delete coupon (Admin Only)
 * @route   DELETE /api/v1/coupons/:id
 * @access  Private/Admin
 */
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  // Ensure seller can only delete their own coupons
  if (req.user.role === 'seller' && coupon.seller?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this coupon");
  }

  await Coupon.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Coupon deleted successfully"));
});

/**
 * @desc    Apply coupon and calculate discounts (Private/User)
 * @route   POST /api/v1/coupons/apply
 * @access  Private
 */
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal, cartItems } = req.body;

  if (!code || cartTotal === undefined) {
    throw new ApiError(400, "Coupon code and cart total are required");
  }

  const result = await calculateCouponDiscount(code, cartTotal, cartItems, req.user._id);

  return res.status(200).json(
    new ApiResponse(200, result, "Coupon applied successfully")
  );
});
