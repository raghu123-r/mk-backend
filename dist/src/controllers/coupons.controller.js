import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get active coupons for users (PUBLIC endpoint)
 * GET /api/coupons/active
 * 
 * Returns only active coupons that are:
 * - active: true
 * - not expired
 * - started (if startDate is set)
 * - usage limit not exceeded
 * 
 * Does NOT expose admin-only fields like createdBy, usedCount, etc.
 */
export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    
    // Find all coupons that meet the basic criteria
    const coupons = await Coupon.find({
      active: true,
      expiryDate: { $gte: now },
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: now } }
      ]
    })
    .populate('applicableProducts', 'name')
    .populate('applicableCategories', 'name')
    .populate('applicableBrands', 'name')
    .lean();
    
    // Filter out coupons that have exceeded usage limit
    const validCoupons = coupons.filter(coupon => {
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return false;
      }
      return true;
    });
    
    // Return only user-safe fields
    const userSafeCoupons = validCoupons.map(coupon => ({
      _id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      applicableProducts: coupon.applicableProducts,
      applicableCategories: coupon.applicableCategories,
      applicableBrands: coupon.applicableBrands,
      expiryDate: coupon.expiryDate,
      startDate: coupon.startDate
    }));
    
    return res.status(200).json(successResponse(userSafeCoupons));
  } catch (error) {
    console.error('Error fetching active coupons:', error);
    return res.status(500).json(errorResponse('Unable to load coupons. Please try again.'));
  }
};

/**
 * Apply coupon to cart (PUBLIC endpoint)
 * POST /api/coupons/apply
 * Body: { code, cartItems: [{ productId, qty, price }], userId? }
 * 
 * This is a public endpoint that can be called by authenticated or guest users.
 * Reuses the validation logic from admin.coupon.controller.js
 */
export const applyCouponPublic = async (req, res) => {
  try {
    const { code, cartItems, userId } = req.body;
    
    // Use authenticated user ID if available, otherwise use provided userId or null
    const effectiveUserId = req.user?.id || req.user?._id || userId || null;
    
    // Find coupon
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() })
      .populate('applicableProducts')
      .populate('applicableCategories')
      .populate('applicableBrands');
    
    if (!coupon) {
      return res.status(404).json(errorResponse('Invalid coupon code'));
    }
    
    // Check if coupon is valid
    if (!coupon.active) {
      return res.status(400).json(errorResponse('Coupon is not active'));
    }
    
    if (coupon.isExpired()) {
      return res.status(400).json(errorResponse('Coupon has expired'));
    }
    
    if (!coupon.hasStarted()) {
      return res.status(400).json(errorResponse('Coupon is not yet active'));
    }
    
    if (coupon.isUsageLimitExceeded()) {
      return res.status(400).json(errorResponse('Coupon usage limit exceeded'));
    }
    
    // Calculate applicable items total
    let applicableTotal = 0;
    const applicableProductIds = coupon.applicableProducts.map(p => p._id.toString());
    const applicableCategoryIds = coupon.applicableCategories.map(c => c._id.toString());
    const applicableBrandIds = coupon.applicableBrands.map(b => b._id.toString());
    
    // If all arrays are empty, coupon is global
    const isGlobal = applicableProductIds.length === 0 && 
                     applicableCategoryIds.length === 0 && 
                     applicableBrandIds.length === 0;
    
    if (isGlobal) {
      // Apply to all items
      applicableTotal = cartItems.reduce((sum, item) => {
        const price = item.price || 0;
        const qty = item.qty || item.quantity || 0;
        return sum + (price * qty);
      }, 0);
    } else {
      // Apply only to matching items
      for (const item of cartItems) {
        const productId = item.productId || item.product;
        const product = await Product.findById(productId).lean();
        
        if (!product) continue;
        
        const matchesProduct = applicableProductIds.includes(productId);
        const matchesCategory = product.category && applicableCategoryIds.includes(product.category.toString());
        const matchesBrand = product.brand && applicableBrandIds.includes(product.brand.toString());
        
        if (matchesProduct || matchesCategory || matchesBrand) {
          const price = item.price || product.price || 0;
          const qty = item.qty || item.quantity || 0;
          applicableTotal += price * qty;
        }
      }
    }
    
    if (applicableTotal === 0) {
      return res.status(400).json(errorResponse('Coupon is not applicable to any items in your cart'));
    }
    
    // Calculate discount
    let discountAmount = 0;
    
    if (coupon.type === 'percentage') {
      discountAmount = applicableTotal * (coupon.value / 100);
    } else if (coupon.type === 'flat') {
      discountAmount = Math.min(coupon.value, applicableTotal);
    }
    
    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;
    
    return res.status(200).json(successResponse({
      success: true,
      discountAmount,
      currency: 'INR',
      message: `Coupon ${coupon.code} applied successfully`,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        applicableTotal
      }
    }));
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json(errorResponse('Server error while applying coupon'));
  }
};
