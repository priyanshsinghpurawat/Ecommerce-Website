import mongoose from 'mongoose';
import { Cart } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { Variant } from '../models/variant.model.js';
import { asyncHandler, ApiError, ApiResponse, normalizeImageUrl } from '../utils/helpers.js';

const mapCartForResponse = (cart) => {
  const obj = cart.toObject ? cart.toObject() : cart;
  return {
    ...obj,
    items: (obj.items || []).map((item) => {
      if (!item.product?.image) return item;
      return {
        ...item,
        product: {
          ...item.product,
          image: normalizeImageUrl(item.product.image),
        },
      };
    }),
  };
};

// Helper to retrieve populated cart
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'title price discountedPrice image category description stock seller',
      populate: { path: 'category', select: 'name slug' },
    })
    .populate({
      path: 'items.variant',
      select: 'sku stock optionValues price images',
    });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

// Read-only cart fetch — returns null if no cart exists (no write on GET)
const getCartIfExists = async (userId) => {
  return Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'title price discountedPrice image category description stock seller',
      populate: { path: 'category', select: 'name slug' },
    })
    .populate({
      path: 'items.variant',
      select: 'sku stock optionValues price images',
    });
};

/**
 * @desc    Get current user's cart
 * @route   GET /api/v3/cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res) => {
  let cart = await getCartIfExists(req.user._id);

  // Return empty cart shape instead of creating a document on every GET
  if (!cart) {
    return res
      .status(200)
      .json(new ApiResponse(200, { user: req.user._id, items: [] }, 'Cart retrieved successfully'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, mapCartForResponse(cart), 'Cart retrieved successfully'));
});

/**
 * @desc    Add product to cart or increment its quantity
 * @route   POST /api/v3/cart/add
 * @access  Private
 */
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size, color, variantId } = req.body;

  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Resolve variant and stock
  let variantDoc = null;
  let availableStock = product.stock;

  if (variantId) {
    variantDoc = await Variant.findById(variantId);
    if (variantDoc) {
      availableStock = variantDoc.stock;
    }
  } else if (size || color) {
    const query = { product: productId, deletedAt: null };
    if (color) query['optionValues.Color'] = color;
    if (size) query['optionValues.Size'] = size;
    variantDoc = await Variant.findOne(query);
    if (variantDoc) {
      availableStock = variantDoc.stock;
    }
  }

  const qtyToAdd = Number(quantity);
  if (qtyToAdd > availableStock) {
    throw new ApiError(400, `Only ${availableStock} units available for this selection`);
  }

  const sizeVal = size || '';
  const colorVal = color || '';
  const variantRef = variantDoc?._id || null;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Try to increment existing item atomically
    let cart;
    if (variantRef) {
      // Match by variant ref for precision
      cart = await Cart.findOneAndUpdate(
        { user: req.user._id, 'items.product': productId, 'items.variant': variantRef },
        { $inc: { 'items.$.quantity': qtyToAdd } },
        { new: true, session },
      );
    }

    // Fallback: match by product + size + color (legacy items without variant ref)
    if (!cart) {
      cart = await Cart.findOneAndUpdate(
        {
          user: req.user._id,
          'items.product': productId,
          'items.size': sizeVal,
          'items.color': colorVal,
        },
        { $inc: { 'items.$.quantity': qtyToAdd } },
        { new: true, session },
      );
    }

    // If no existing item matched, push new item
    if (!cart) {
      cart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        {
          $push: {
            items: {
              product: productId,
              variant: variantRef,
              quantity: qtyToAdd,
              size: sizeVal,
              color: colorVal,
            },
          },
          $setOnInsert: { user: req.user._id },
        },
        { new: true, upsert: true, session },
      );
    }

    // Post-update stock validation
    const updatedItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        (variantRef ? item.variant?.toString() === variantRef.toString() : true) &&
        (item.size || '') === sizeVal &&
        (item.color || '') === colorVal,
    );

    if (updatedItem && updatedItem.quantity > availableStock) {
      throw new ApiError(400, `Only ${availableStock} units available for this selection`);
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  const populatedCart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, mapCartForResponse(populatedCart), 'Item added to cart'));
});

/**
 * @desc    Update specific item quantity in cart
 * @route   PUT /api/v3/cart/update
 * @access  Private
 */
export const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { itemId, quantity } = req.body;

  if (!itemId || quantity === undefined) {
    throw new ApiError(400, 'Item ID and quantity are required');
  }

  const quantityNum = Number(quantity);
  if (quantityNum < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ user: req.user._id, 'items._id': itemId });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  const cartItem = cart.items.find((item) => item._id.toString() === itemId);
  if (!cartItem) {
    throw new ApiError(404, 'Item not found in cart');
  }

  const product = await Product.findById(cartItem.product);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Resolve stock
  let availableStock = product.stock;
  if (cartItem.variant) {
    const variant = await Variant.findById(cartItem.variant);
    if (variant) availableStock = variant.stock;
  } else if (cartItem.size || cartItem.color) {
    const query = { product: product._id, deletedAt: null };
    if (cartItem.color) query['optionValues.Color'] = cartItem.color;
    if (cartItem.size) query['optionValues.Size'] = cartItem.size;
    const variant = await Variant.findOne(query);
    if (variant) availableStock = variant.stock;
  }

  if (quantityNum > availableStock) {
    throw new ApiError(400, `Only ${availableStock} units available for this selection`);
  }

  const updatedCart = await Cart.findOneAndUpdate(
    { user: req.user._id, 'items._id': itemId },
    { $set: { 'items.$.quantity': quantityNum } },
    { new: true },
  );

  if (!updatedCart) {
    throw new ApiError(404, 'Cart not found or item removed concurrently');
  }

  const populatedCart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        mapCartForResponse(populatedCart),
        'Cart item quantity updated successfully',
      ),
    );
});

/**
 * @desc    Remove an item from cart
 * @route   DELETE /api/v3/cart/remove/:itemId
 * @access  Private
 */
export const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  if (!itemId) {
    throw new ApiError(400, 'Item ID is required');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  await Cart.findOneAndUpdate({ user: req.user._id }, { $pull: { items: { _id: itemId } } });

  const populatedCart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        mapCartForResponse(populatedCart),
        'Item removed from cart successfully',
      ),
    );
});

/**
 * @desc    Clear all items in cart
 * @route   DELETE /api/v3/cart/clear
 * @access  Private
 */

export const mergeCart = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res
      .status(200)
      .json(new ApiResponse(200, { user: req.user._id, items: [] }, 'No items to merge'));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let cart = await Cart.findOne({ user: req.user._id }).session(session);

    for (const guestItem of items) {
      const product = await Product.findById(guestItem.productId).session(session);
      if (!product) continue;

      // Resolve stock
      let variantDoc = null;
      let availableStock = product.stock;

      if (guestItem.variantId) {
        variantDoc = await Variant.findById(guestItem.variantId).session(session);
        if (variantDoc) availableStock = variantDoc.stock;
      } else if (guestItem.size || guestItem.color) {
        const query = { product: guestItem.productId, deletedAt: null };
        if (guestItem.color) query['optionValues.Color'] = guestItem.color;
        if (guestItem.size) query['optionValues.Size'] = guestItem.size;
        variantDoc = await Variant.findOne(query).session(session);
        if (variantDoc) availableStock = variantDoc.stock;
      }

      const safeQty = Math.min(guestItem.quantity, availableStock);
      if (safeQty < 1) continue;

      const variantRef = variantDoc?._id || null;
      const sizeVal = guestItem.size || '';
      const colorVal = guestItem.color || '';

      // Try to find existing matching item
      const existingIdx = cart?.items?.findIndex(
        (item) =>
          item.product.toString() === guestItem.productId &&
          (variantRef ? item.variant?.toString() === variantRef.toString() : true) &&
          (item.size || '') === sizeVal &&
          (item.color || '') === colorVal,
      );

      if (existingIdx !== undefined && existingIdx >= 0) {
        const newQty = Math.min((cart.items[existingIdx].quantity || 0) + safeQty, availableStock);
        cart.items[existingIdx].quantity = newQty;
      } else {
        if (!cart) {
          cart = new Cart({ user: req.user._id, items: [] });
        }
        cart.items.push({
          product: guestItem.productId,
          variant: variantRef,
          quantity: safeQty,
          size: sizeVal,
          color: colorVal,
        });
      }
    }

    if (cart) {
      await cart.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  const populatedCart = await getPopulatedCart(req.user._id);
  return res
    .status(200)
    .json(
      new ApiResponse(200, mapCartForResponse(populatedCart), 'Guest cart merged successfully'),
    );
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

  const populatedCart = await getPopulatedCart(req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, mapCartForResponse(populatedCart), 'Cart cleared successfully'));
});
