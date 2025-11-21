import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from '../controllers/cart.controller.js';

/**
 * Cart Routes
 * 
 * All routes require authentication via the protect middleware.
 * The protect middleware sets req.user = { id, role, email } from JWT token.
 * 
 * Available endpoints:
 * - GET    /api/cart         - Fetch user's cart
 * - POST   /api/cart         - Add item to cart or update if exists
 * - PATCH  /api/cart/item    - Update cart item quantity
 * - DELETE /api/cart/item    - Remove item from cart
 * - POST   /api/cart/clear   - Clear all items from cart
 * 
 * Request/Response formats:
 * 
 * GET /api/cart
 *   Response: { success: true, data: { items: [...], total: 123.45 }, message: "..." }
 * 
 * POST /api/cart
 *   Body: { productId: "64abc...", qty: 2 }
 *   Response: { success: true, data: { items: [...], total: 123.45 }, message: "..." }
 * 
 * PATCH /api/cart/item
 *   Body: { productId: "64abc...", qty: 3 }  // qty <= 0 removes item
 *   Response: { success: true, data: { items: [...], total: 123.45 }, message: "..." }
 * 
 * DELETE /api/cart/item
 *   Body: { productId: "64abc..." }
 *   Response: { success: true, data: { items: [...], total: 123.45 }, message: "..." }
 * 
 * POST /api/cart/clear
 *   Response: { success: true, data: { items: [], total: 0 }, message: "..." }
 */

const router = Router();

// All cart routes require authentication
router.use(protect);

/**
 * @route   GET /api/cart
 * @desc    Get user's shopping cart
 * @access  Private (requires authentication)
 */
router.get('/', getCart);

/**
 * @route   POST /api/cart
 * @desc    Add product to cart or update quantity if already exists
 * @access  Private (requires authentication)
 * @body    { productId: String, qty: Number }
 */
router.post('/', addToCart);

/**
 * @route   PATCH /api/cart/item
 * @desc    Update cart item quantity (qty <= 0 removes item)
 * @access  Private (requires authentication)
 * @body    { productId: String, qty: Number }
 */
router.patch('/item', updateCartItem);

/**
 * @route   DELETE /api/cart/item
 * @desc    Remove item from cart
 * @access  Private (requires authentication)
 * @body    { productId: String }
 */
router.delete('/item', removeCartItem);

/**
 * @route   POST /api/cart/clear
 * @desc    Clear all items from cart (useful after order creation)
 * @access  Private (requires authentication)
 */
router.post('/clear', clearCart);

export default router;
