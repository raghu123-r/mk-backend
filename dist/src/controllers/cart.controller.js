import mongoose from 'mongoose';
import createError from 'http-errors';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * Cart Controller
 * 
 * Handles all cart operations including:
 * - Fetching user's cart
 * - Adding products to cart
 * - Updating cart item quantities
 * - Removing items from cart
 * - Clearing entire cart
 * 
 * All endpoints require authentication via auth middleware.
 * Price snapshots are always taken from Product model to prevent price manipulation.
 * 
 * Testing:
 * - GET /api/cart — Fetch cart (empty cart returns { items: [], total: 0 })
 * - POST /api/cart with {"productId":"<id>","qty":2} — Add/update item
 * - PATCH /api/cart/item with {"productId":"<id>","qty":3} — Update quantity
 * - DELETE /api/cart/item with {"productId":"<id>"} — Remove item
 * - POST /api/cart/clear — Clear all items
 */

/**
 * Get user's cart
 * @route GET /api/cart
 * @access Private (requires auth)
 * @returns {Object} Cart with items array and total
 */
export const getCart = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return next(createError(401, 'Authentication required'));
    }

    const userId = req.user.id;

    // Find cart for the authenticated user
    let cart = await Cart.findOne({ userId });

    // If no cart exists yet, return empty cart structure
    if (!cart) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: {
          items: [],
          total: 0
        },
        message: 'Cart is empty'
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: cart,
      message: 'Cart retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    next(error);
  }
};

/**
 * Add product to cart or update quantity if already exists
 * @route POST /api/cart
 * @access Private (requires auth)
 * @body {String} productId - Product ID to add
 * @body {Number} qty - Quantity to add (min: 1)
 * @returns {Object} Updated cart
 */
export const addToCart = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return next(createError(401, 'Authentication required'));
    }

    const { productId, qty } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId) {
      return next(createError(400, 'Product ID is required'));
    }

    if (!qty || qty < 1 || !Number.isInteger(qty)) {
      return next(createError(400, 'Quantity must be a positive integer'));
    }

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createError(400, 'Invalid product ID format'));
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return next(createError(404, 'Product not found'));
    }

    if (!product.isActive) {
      return next(createError(400, 'Product is not available'));
    }

    // Check stock availability
    if (product.stock < qty) {
      return next(createError(400, `Only ${product.stock} items available in stock`));
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ userId });
    let isNewCart = false;

    if (!cart) {
      cart = new Cart({
        userId,
        items: []
      });
      isNewCart = true;
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex !== -1) {
      // Product exists - update quantity and price snapshot
      const newQty = cart.items[existingItemIndex].qty + qty;
      
      // Check if new quantity exceeds stock
      if (newQty > product.stock) {
        return next(createError(400, `Cannot add ${qty} more. Only ${product.stock} items available in stock`));
      }

      cart.items[existingItemIndex].qty = newQty;
      cart.items[existingItemIndex].price = product.price; // Update price snapshot
      cart.items[existingItemIndex].title = product.title; // Update title in case it changed
      cart.items[existingItemIndex].image = product.images?.[0] || ''; // Update image
    } else {
      // Product doesn't exist - add new item with snapshot
      const newItem = {
        productId: product._id,
        qty,
        price: product.price, // Snapshot current price
        title: product.title, // Snapshot title
        image: product.images?.[0] || '' // Snapshot first image
      };
      cart.items.push(newItem);
    }

    // Save cart (pre-save hook will recalculate total)
    await cart.save();

    return res.status(isNewCart ? 201 : 200).json({
      statusCode: isNewCart ? 201 : 200,
      success: true,
      error: null,
      data: cart,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    next(error);
  }
};

/**
 * Update cart item quantity
 * @route PATCH /api/cart/item
 * @access Private (requires auth)
 * @body {String} productId - Product ID to update
 * @body {Number} qty - New quantity (0 or negative removes item)
 * @returns {Object} Updated cart
 */
export const updateCartItem = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return next(createError(401, 'Authentication required'));
    }

    const { productId, qty } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId) {
      return next(createError(400, 'Product ID is required'));
    }

    if (qty === undefined || qty === null) {
      return next(createError(400, 'Quantity is required'));
    }

    if (!Number.isInteger(qty)) {
      return next(createError(400, 'Quantity must be an integer'));
    }

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createError(400, 'Invalid product ID format'));
    }

    // Find user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(createError(404, 'Cart not found'));
    }

    // Find the item in cart
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return next(createError(404, 'Item not found in cart'));
    }

    // If quantity is 0 or negative, remove the item
    if (qty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity and verify stock if product still exists
      const product = await Product.findById(productId);
      if (product && product.stock < qty) {
        return next(createError(400, `Only ${product.stock} items available in stock`));
      }

      cart.items[itemIndex].qty = qty;
      
      // Update price snapshot if product exists (optional: keeps price in sync)
      if (product) {
        cart.items[itemIndex].price = product.price;
        cart.items[itemIndex].title = product.title;
        cart.items[itemIndex].image = product.images?.[0] || '';
      }
    }

    // Save cart (pre-save hook will recalculate total)
    await cart.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: cart,
      message: qty <= 0 ? 'Item removed from cart' : 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    next(error);
  }
};

/**
 * Remove item from cart
 * @route DELETE /api/cart/item
 * @access Private (requires auth)
 * @body {String} productId - Product ID to remove
 * @returns {Object} Updated cart
 */
export const removeCartItem = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return next(createError(401, 'Authentication required'));
    }

    const { productId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId) {
      return next(createError(400, 'Product ID is required'));
    }

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return next(createError(400, 'Invalid product ID format'));
    }

    // Find user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(createError(404, 'Cart not found'));
    }

    // Find the item in cart
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return next(createError(404, 'Item not found in cart'));
    }

    // Remove the item
    cart.items.splice(itemIndex, 1);

    // Save cart (pre-save hook will recalculate total)
    await cart.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: cart,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    next(error);
  }
};

/**
 * Clear all items from cart
 * @route POST /api/cart/clear
 * @access Private (requires auth)
 * @returns {Object} Empty cart
 * @description Useful helper for order creation flow - clears cart after successful order
 */
export const clearCart = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return next(createError(401, 'Authentication required'));
    }

    const userId = req.user.id;

    // Find user's cart
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      // No cart exists, return empty cart response
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: {
          items: [],
          total: 0
        },
        message: 'Cart is already empty'
      });
    }

    // Clear all items
    cart.items = [];
    
    // Save cart (pre-save hook will set total to 0)
    await cart.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: cart,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    next(error);
  }
};
