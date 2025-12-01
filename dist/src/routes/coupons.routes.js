import { Router } from 'express';
import { applyCouponPublic } from '../controllers/coupons.controller.js';
import { applyCouponRules, handleValidationErrors } from '../validators/coupon.validator.js';

const router = Router();

// Public route to apply coupon (no admin required)
// Can be called by authenticated or unauthenticated users
router.post('/apply', applyCouponRules, handleValidationErrors, applyCouponPublic);

export default router;
