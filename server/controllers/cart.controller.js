import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler, ApiError, ApiResponse, normalizeImageUrl } from '../utils/helpers.js';

const mapCartForResponse = (cart, req) => {
  const obj = cart.toObject ? cart.toObject() : cart;
  return {
    ...obj,
    items: (obj.items || []).map((item) => {
      if (!item.product?.image) return item;
      return {
        ...item,
        product: {
          ...item.product,
          image: normalizeImageUrl(item.product.image)
        }
      };
    })
  };
};

// Helper to retrieve populated cart
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'title price discountedPrice image category description stock seller',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });

  // If cart doesn't exist, initialize an empty one in database
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

/**
 * @desc    Get current user's cart
 * @route   GET /api/v1/cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res) => {
  const cart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, mapCartForResponse(cart, req), "Cart retrieved successfully"));
});

/**
 * @desc    Add product to cart or increment its quantity
 * @route   POST /api/v1/cart/add
 * @access  Private
 */
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size, color } = req.body;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Check if item with SAME productId, size, AND color already exists
  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId && 
    (item.size || '') === (size || '') && 
    (item.color || '') === (color || '')
  );

  const newQty = itemIndex > -1
    ? cart.items[itemIndex].quantity + Number(quantity)
    : Number(quantity);

  // Stock validation
  let availableStock = product.stock;
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants.find(
      v => (v.size || '') === (size || '') && (v.color || '') === (color || '')
    );
    if (variant) {
      availableStock = variant.stock;
    }
  }

  if (newQty > availableStock) {
    throw new ApiError(400, `Only ${availableStock} units available for this selection`);
  }

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = newQty;
  } else {
    // Add new item with specific size and color
    cart.items.push({ product: productId, quantity: Number(quantity), size, color });
  }

  await cart.save();

  const populatedCart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, mapCartForResponse(populatedCart, req), "Item added to cart"));
});

/**
 * @desc    Update specific item quantity in cart
 * @route   PUT /api/v1/cart/update
 * @access  Private
 */
export const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { itemId, quantity } = req.body;

  if (!itemId || quantity === undefined) {
    throw new ApiError(400, "Item ID and quantity are required");
  }

  const quantityNum = Number(quantity);
  if (quantityNum < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) {
    throw new ApiError(404, "Item not found in cart");
  }

  const cartItem = cart.items[itemIndex];
  const product = await Product.findById(cartItem.product);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Stock validation
  let availableStock = product.stock;
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants.find(
      v => (v.size || '') === (cartItem.size || '') && (v.color || '') === (cartItem.color || '')
    );
    if (variant) {
      availableStock = variant.stock;
    }
  }

  if (quantityNum > availableStock) {
    throw new ApiError(400, `Only ${availableStock} units available for this selection`);
  }

  cart.items[itemIndex].quantity = quantityNum;
  await cart.save();

  const populatedCart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, mapCartForResponse(populatedCart, req), "Cart item quantity updated successfully"));
});

/**
 * @desc    Remove an item from cart
 * @route   DELETE /api/v1/cart/remove/:itemId
 * @access  Private
 */
export const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    throw new ApiError(400, "Item ID is required");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  // Evict item by its unique database _id
  cart.items = cart.items.filter(item => item._id.toString() !== itemId);
  await cart.save();

  const populatedCart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, mapCartForResponse(populatedCart, req), "Item removed from cart successfully"));
});

/**
 * @desc    Clear all items in cart
 * @route   DELETE /api/v1/cart/clear
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  cart.items = [];
  await cart.save();

  const populatedCart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, mapCartForResponse(populatedCart, req), "Cart cleared successfully"));
});
