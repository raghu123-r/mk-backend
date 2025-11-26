import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { requestOtp, verifyOtp, validators } from '../controllers/auth.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.post('/request-otp', validate(validators.requestOtpSchema), requestOtp);
router.post('/verify-otp', validate(validators.verifyOtpSchema), verifyOtp);

/**
 * GET /auth/verify
 * Cookie-based admin verification endpoint
 * Returns admin user details if authenticated with valid adminToken cookie
 */
router.get('/verify', requireAuth, requireAdmin, (req, res) => {
  return res.json({
    ok: true,
    user: {
      _id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
});

export default router;

