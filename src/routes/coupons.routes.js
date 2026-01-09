import { Router } from 'express';
import { getActiveCoupons, applyCouponPublic } from '../controllers/coupons.controller.js';
import { applyCouponRules, handleValidationErrors } from '../validators/coupon.validator.js';

const router = Router();

// Get active coupons for users (public)
router.get('/active', getActiveCoupons);

// Public route to apply coupon (no admin required)
// Can be called by authenticated or unauthenticated users
router.post('/apply', applyCouponRules, handleValidationErrors, applyCouponPublic);

export default router;
