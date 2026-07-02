import { User } from '../models/user.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler, ApiError, ApiResponse } from '../utils/helpers.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import { deleteFromCloudinary } from '../middleware/upload.middleware.js';

/**
 * @desc    Get all vendors (Admin)
 * @route   GET /api/v3/users/vendors
 * @access  Private/Admin
 */
export const getVendors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [result] = await User.aggregate([
    {
      $match: { role: 'seller' }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              password: 0
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: 'seller',
              as: 'products'
            }
          },
          {
            $addFields: {
              productIds: '$products._id',
              categoryIds: '$products.category'
            }
          },
          {
            $lookup: {
              from: 'categories',
              localField: 'categoryIds',
              foreignField: '_id',
              as: 'categoryDocs'
            }
          },
          {
            $addFields: {
              categories: {
                $reduce: {
                  input: '$categoryDocs.name',
                  initialValue: [],
                  in: {
                    $cond: [
                      { $in: ['$$this', '$$value'] },
                      '$$value',
                      { $concatArrays: ['$$value', ['$$this']] }
                    ]
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'orders',
              localField: 'productIds',
              foreignField: 'items.product',
              as: 'matchingOrders'
            }
          },
          {
            $addFields: {
              totalOrders: { $size: '$matchingOrders' }
            }
          },
          {
            $project: {
              products: 0,
              productIds: 0,
              categoryIds: 0,
              categoryDocs: 0,
              matchingOrders: 0
            }
          }
        ]
      }
    }
  ]);

  const total = result.metadata[0]?.total || 0;
  const vendors = result.data;

  return res.status(200).json(new ApiResponse(200, {
    vendors,
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    }
  }, 'Vendors retrieved successfully'));
});

/**
 * @desc    Toggle vendor active status (Admin)
 * @route   PATCH /api/v3/users/vendors/:id/status
 * @access  Private/Admin
 */
export const toggleVendorStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  
  if (!user || user.role !== 'seller') {
    throw new ApiError(404, 'Vendor not found');
  }

  user.isActive = !user.isActive;
  await user.save();

  return res.status(200).json(new ApiResponse(200, user, `Vendor status updated to ${user.isActive ? 'Active' : 'Inactive'}`));
});

/**
 * @desc    Get detailed vendor profile (Admin)
 * @route   GET /api/v3/users/vendors/:id
 * @access  Private/Admin
 */
export const getVendorProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await User.findById(id).select('-password').lean();
  
  if (!vendor || vendor.role !== 'seller') {
    throw new ApiError(404, 'Vendor not found');
  }

  const products = await Product.find({ seller: id }).populate('category subcategory').lean();
  const productIds = products.map(p => p._id);
  
  const productIdSet = new Set(productIds.map(pid => pid.toString()));
  
  const orders = await Order.find({ "items.product": { $in: productIds } })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  
  const activeOrdersCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  
  // Calculate analytics
  let totalRevenue = 0;
  const productStats = {}; // To track units and revenue per product

  orders.forEach(order => {
    const isRevenueOrder = ['confirmed', 'shipped', 'delivered'].includes(order.status);
    
    order.items.forEach(item => {
      const itemProductId = item.product?._id || item.product;
      const productIdStr = String(itemProductId);
      
      if (!productIdSet.has(productIdStr)) return;
      
      const itemRevenue = item.unitPrice * item.quantity;
      
      if (isRevenueOrder) {
        totalRevenue += itemRevenue;
      }
      
      if (!productStats[productIdStr]) {
        productStats[productIdStr] = { revenue: 0, units: 0 };
      }
      
      if (isRevenueOrder) {
        productStats[productIdStr].revenue += itemRevenue;
        productStats[productIdStr].units += item.quantity;
      }
    });
  });

  // Enhance products with sales data and sort for top products
  const productsWithStats = products.map(p => {
    const stats = productStats[p._id.toString()] || { revenue: 0, units: 0 };
    return {
      ...p,
      revenue: stats.revenue,
      unitsSold: stats.units
    };
  });

  const topProducts = [...productsWithStats]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentOrders = orders.slice(0, 5).map(o => {
    const vendorItems = o.items.filter(item => {
      const itemProductId = item.product?._id || item.product;
      return productIdSet.has(String(itemProductId));
    });
    
    return {
      _id: o._id,
      orderNumber: o.orderNumber,
      customer: o.user?.name || 'Guest',
      status: o.status,
      createdAt: o.createdAt,
      vendorItemsCount: vendorItems.length,
      vendorSubtotal: vendorItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    };
  });

  return res.status(200).json(new ApiResponse(200, {
    vendor,
    stats: {
      totalProducts: products.length,
      activeOrders: activeOrdersCount,
      totalRevenue
    },
    products: productsWithStats,
    topProducts,
    recentOrders
  }, 'Vendor profile retrieved successfully'));
});

/**
 * @desc    Get all users (Admin)
 * @route   GET /api/v3/users
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [result] = await User.aggregate([
    {
      $sort: { createdAt: -1 }
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              password: 0
            }
          },
          {
            $lookup: {
              from: 'orders',
              localField: '_id',
              foreignField: 'user',
              as: 'orders'
            }
          },
          {
            $addFields: {
              totalOrders: { $size: '$orders' }
            }
          },
          {
            $project: {
              orders: 0
            }
          }
        ]
      }
    }
  ]);

  const total = result.metadata[0]?.total || 0;
  const users = result.data;

  return res.status(200).json(new ApiResponse(200, {
    users,
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    }
  }, 'Users retrieved successfully'));
});

/**
 * @desc    Update user role (Admin)
 * @route   PATCH /api/v3/users/:id/role
 * @access  Private/Admin
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin', 'seller'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  // Prevent admin from changing their own role
  if (id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot change your own role');
  }

  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // If demoting an admin, ensure at least one other admin remains
  if (user.role === 'admin' && role !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot demote the last admin. Promote another user first.');
    }
  }

  user.role = role;
  await user.save();

  return res.status(200).json(new ApiResponse(200, user, `User role updated to ${role}`));
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v3/users/me
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Data Normalization (Transition from singular address to addresses array)
  const userData = user;
  if ((!userData.addresses || userData.addresses.length === 0) && userData.address) {
    const legacyAddr = userData.address;
    if (legacyAddr.street || legacyAddr.city) {
      userData.addresses = [{
        fullName: userData.name,
        phone: userData.phone || '',
        street: legacyAddr.street || '',
        city: legacyAddr.city || '',
        state: legacyAddr.state || '',
        zipCode: legacyAddr.zipCode || '',
        country: legacyAddr.country || 'India',
        isDefault: true
      }];
    }
  }

  if (!userData.addresses) userData.addresses = [];

  return res.status(200).json(new ApiResponse(200, userData, 'Profile retrieved successfully'));
});

/**
 * @desc    Update profile info (name, phone, avatar, brandName, storefront)
 * @route   PUT /api/v3/users/me
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, brandName, storefront } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name && typeof name === 'string') user.name = name.trim();
  if (phone !== undefined) user.phone = typeof phone === 'string' ? phone.trim() : '';
  if (avatar !== undefined) user.avatar = typeof avatar === 'string' ? avatar.trim() : '';
  
  if (user.role === 'seller') {
    if (brandName !== undefined) user.brandName = typeof brandName === 'string' ? brandName.trim() : '';
    if (storefront && typeof storefront === 'object') {
      if (!user.storefront) user.storefront = {};
      if (storefront.banner !== undefined) user.storefront.banner = typeof storefront.banner === 'string' ? storefront.banner.trim() : '';
      if (storefront.description !== undefined) user.storefront.description = typeof storefront.description === 'string' ? storefront.description.trim() : '';
      if (storefront.returnPolicy !== undefined) user.storefront.returnPolicy = typeof storefront.returnPolicy === 'string' ? storefront.returnPolicy.trim() : '';
      if (storefront.slug !== undefined) user.storefront.slug = typeof storefront.slug === 'string' ? storefront.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : '';
    }
  }

  await user.save();
  const updated = await User.findById(user._id).select('-password');

  return res.status(200).json(new ApiResponse(200, updated, 'Profile updated successfully'));
});

/**
 * @desc    Upload profile avatar image
 * @route   POST /api/v3/users/me/avatar
 * @access  Private
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file provided. Send a single image under the "avatar" field.');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Delete previous Cloudinary avatar if it exists
  if (user.avatar && user.avatar.includes('res.cloudinary.com')) {
    await deleteFromCloudinary(user.avatar);
  }

  const avatarUrl = await uploadBufferToCloudinary(req.file.buffer, {
    folder: 'mensvibe/avatars',
    filename: `avatar_${user._id.toString()}`
  });

  user.avatar = avatarUrl;
  await user.save();

  const updated = await User.findById(user._id).select('-password');

  return res.status(200).json(new ApiResponse(200, updated, 'Avatar uploaded successfully'));
});

/**
 * @desc    Add new address to address book
 * @route   POST /api/v3/users/addresses
 * @access  Private
 */
export const addAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

  const user = await User.findById(req.user._id);
  
  const newAddress = {
    fullName,
    phone,
    street,
    city,
    state,
    zipCode,
    country: country || 'India',
    isDefault: isDefault || false
  };

  // If this is the first address or marked as default, unset others
  if (user.addresses.length === 0) {
    newAddress.isDefault = true;
  } else if (newAddress.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  user.addresses.push(newAddress);
  await user.save();

  return res.status(201).json(new ApiResponse(201, user.addresses, 'Address added successfully'));
});

/**
 * @desc    Update existing address
 * @route   PUT /api/v3/users/addresses/:id
 * @access  Private
 */
export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Whitelist only the allowed address fields — never Object.assign raw body
  const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;
  const safeUpdates = {};
  if (fullName !== undefined) safeUpdates.fullName = fullName;
  if (phone !== undefined) safeUpdates.phone = phone;
  if (street !== undefined) safeUpdates.street = street;
  if (city !== undefined) safeUpdates.city = city;
  if (state !== undefined) safeUpdates.state = state;
  if (zipCode !== undefined) safeUpdates.zipCode = zipCode;
  if (country !== undefined) safeUpdates.country = country;
  if (isDefault !== undefined) safeUpdates.isDefault = isDefault;

  const user = await User.findById(req.user._id);
  const address = user.addresses.id(id);

  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  // If marking as default, unset others
  if (safeUpdates.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  Object.assign(address, safeUpdates);
  await user.save();

  return res.status(200).json(new ApiResponse(200, user.addresses, 'Address updated successfully'));
});

/**
 * @desc    Delete address from book
 * @route   DELETE /api/v3/users/addresses/:id
 * @access  Private
 */
export const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(req.user._id);
  const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === id);

  if (addressIndex === -1) {
    throw new ApiError(404, 'Address not found');
  }

  const wasDefault = user.addresses[addressIndex].isDefault;
  user.addresses.splice(addressIndex, 1);

  // If we deleted the default, set the first remaining as default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return res.status(200).json(new ApiResponse(200, user.addresses, 'Address deleted successfully'));
});

/**
 * @desc    Set default address
 * @route   PATCH /api/v3/users/addresses/:id/default
 * @access  Private
 */
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(req.user._id);
  const address = user.addresses.id(id);

  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  user.addresses.forEach(addr => {
    addr.isDefault = addr._id.toString() === id;
  });

  await user.save();
  return res.status(200).json(new ApiResponse(200, user.addresses, 'Default address updated'));
});

/**
 * @desc    Get user wishlist
 * @route   GET /api/v3/users/wishlist
 * @access  Private
 */
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist').lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return res.status(200).json(new ApiResponse(200, user.wishlist, 'Wishlist retrieved successfully'));
});

/**
 * @desc    Add product to wishlist
 * @route   POST /api/v3/users/wishlist
 * @access  Private
 */
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.wishlist.some(id => id.toString() === productId)) {
    return res.status(200).json(new ApiResponse(200, user.wishlist, 'Product already in wishlist'));
  }

  user.wishlist.push(productId);
  await user.save();

  return res.status(200).json(new ApiResponse(200, user.wishlist, 'Product added to wishlist'));
});

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/v3/users/wishlist/:productId
 * @access  Private
 */
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();

  return res.status(200).json(new ApiResponse(200, user.wishlist, 'Product removed from wishlist'));
});
