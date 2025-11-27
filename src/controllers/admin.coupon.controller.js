import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * List all coupons with pagination and filters
 * GET /admin/coupons?page=1&limit=20&active=true&search=code
 */
export const listCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Filter by active status
    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }
    
    // Filter by expired status
    if (req.query.expired === 'true') {
      filter.expiryDate = { $lt: new Date() };
    } else if (req.query.expired === 'false') {
      filter.expiryDate = { $gte: new Date() };
    }
    
    // Search by code
    if (req.query.search) {
      filter.code = { $regex: req.query.search.toUpperCase(), $options: 'i' };
    }
    
    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name')
      .populate('applicableBrands', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    return res.status(200).json(successResponse({
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    console.error('Error listing coupons:', error);
    return res.status(500).json(errorResponse('Server error'));
  }
};

/**
 * Get single coupon by ID
 * GET /admin/coupons/:id
 */
export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name')
      .populate('applicableBrands', 'name')
      .lean();
    
    if (!coupon) {
      return res.status(404).json(errorResponse('Coupon not found'));
    }
    
    return res.status(200).json(successResponse(coupon));
  } catch (error) {
    console.error('Error getting coupon:', error);
    return res.status(500).json(errorResponse('Server error'));
  }
};

/**
 * Create new coupon
 * POST /admin/coupons
 */
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      applicableProducts,
      applicableCategories,
      applicableBrands,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      active
    } = req.body;
    
    // Additional validation for percentage type
    if (type === 'percentage' && (value < 1 || value > 100)) {
      return res.status(400).json(errorResponse('Percentage value must be between 1 and 100'));
    }
    
    // Check if code already exists (case-insensitive)
    const existingCoupon = await Coupon.findOne({ 
      code: code.toUpperCase().trim() 
    });
    
    if (existingCoupon) {
      return res.status(409).json(errorResponse('Coupon code already exists'));
    }
    
    // Validate expiry date is in the future
    if (new Date(expiryDate) <= new Date()) {
      return res.status(400).json(errorResponse('Expiry date must be in the future'));
    }
    
    const coupon = new Coupon({
      code: code.toUpperCase().trim(),
      type,
      value,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      applicableBrands: applicableBrands || [],
      startDate: startDate || Date.now(),
      expiryDate,
      usageLimit,
      perUserLimit,
      active: active !== undefined ? active : true,
      createdBy: req.user.id || req.user._id
    });
    
    await coupon.save();
    
    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name')
      .populate('applicableBrands', 'name')
      .lean();
    
    return res.status(201).json(successResponse(populatedCoupon, 'Coupon created successfully'));
  } catch (error) {
    console.error('Error creating coupon:', error);
    if (error.code === 11000) {
      return res.status(409).json(errorResponse('Coupon code already exists'));
    }
    return res.status(500).json(errorResponse(error.message || 'Server error'));
  }
};

/**
 * Update coupon
 * PUT /admin/coupons/:id
 */
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) {
      return res.status(404).json(errorResponse('Coupon not found'));
    }
    
    const {
      code,
      type,
      value,
      applicableProducts,
      applicableCategories,
      applicableBrands,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      active
    } = req.body;
    
    // If changing code, check uniqueness
    if (code && code.toUpperCase().trim() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: code.toUpperCase().trim(),
        _id: { $ne: req.params.id }
      });
      
      if (existingCoupon) {
        return res.status(409).json(errorResponse('Coupon code already exists'));
      }
      
      coupon.code = code.toUpperCase().trim();
    }
    
    // Additional validation for percentage type
    if (type === 'percentage' && value && (value < 1 || value > 100)) {
      return res.status(400).json(errorResponse('Percentage value must be between 1 and 100'));
    }
    
    // Update fields
    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (applicableProducts !== undefined) coupon.applicableProducts = applicableProducts;
    if (applicableCategories !== undefined) coupon.applicableCategories = applicableCategories;
    if (applicableBrands !== undefined) coupon.applicableBrands = applicableBrands;
    if (startDate !== undefined) coupon.startDate = startDate;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit;
    if (active !== undefined) coupon.active = active;
    
    // Do not allow changing createdBy
    
    await coupon.save();
    
    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('createdBy', 'name email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name')
      .populate('applicableBrands', 'name')
      .lean();
    
    return res.status(200).json(successResponse(populatedCoupon, 'Coupon updated successfully'));
  } catch (error) {
    console.error('Error updating coupon:', error);
    return res.status(500).json(errorResponse(error.message || 'Server error'));
  }
};

/**
 * Delete coupon
 * DELETE /admin/coupons/:id
 */
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    
    if (!coupon) {
      return res.status(404).json(errorResponse('Coupon not found'));
    }
    
    return res.status(200).json(successResponse(null, 'Coupon deleted successfully'));
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return res.status(500).json(errorResponse('Server error'));
  }
};

/**
 * Apply coupon to cart
 * POST /admin/coupons/apply (or can be public endpoint)
 * Body: { code, cartItems: [{ productId, quantity, price }], userId }
 */
export const applyCoupon = async (req, res) => {
  try {
    const { code, cartItems, userId } = req.body;
    
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
    
    // TODO: Check perUserLimit when we track user-specific usage
    
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
        return sum + (item.price * item.quantity);
      }, 0);
    } else {
      // Apply only to matching items
      for (const item of cartItems) {
        const product = await Product.findById(item.productId).lean();
        
        if (!product) continue;
        
        const matchesProduct = applicableProductIds.includes(item.productId);
        const matchesCategory = product.category && applicableCategoryIds.includes(product.category.toString());
        const matchesBrand = product.brand && applicableBrandIds.includes(product.brand.toString());
        
        if (matchesProduct || matchesCategory || matchesBrand) {
          applicableTotal += item.price * item.quantity;
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
      ok: true,
      discountAmount,
      currency: 'INR',
      message: `Coupon ${coupon.code} applied successfully`,
      couponDetails: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        applicableTotal
      }
    }));
  } catch (error) {
    console.error('Error applying coupon:', error);
    return res.status(500).json(errorResponse('Server error'));
  }
};
