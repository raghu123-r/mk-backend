import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon
} from '../controllers/admin.coupon.controller.js';
import {
  createCouponRules,
  updateCouponRules,
  applyCouponRules,
  handleValidationErrors
} from '../validators/coupon.validator.js';

const router = Router();

// All routes require admin authentication
router.use(requireAuth, requireAdmin);

// List coupons with pagination and filters
router.get('/', listCoupons);

// Get single coupon
router.get('/:id', getCoupon);

// Create new coupon
router.post('/', createCouponRules, handleValidationErrors, createCoupon);

// Update coupon
router.put('/:id', updateCouponRules, handleValidationErrors, updateCoupon);

// Delete coupon
router.delete('/:id', deleteCoupon);

// Apply coupon (test endpoint)
router.post('/apply', applyCouponRules, handleValidationErrors, applyCoupon);

export default router;
