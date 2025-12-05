import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { requestOtp, verifyOtp, validators } from '../controllers/auth.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.post('/request-otp', validate(validators.requestOtpSchema), requestOtp);
router.post('/verify-otp', validate(validators.verifyOtpSchema), verifyOtp);

/**
 * POST /auth/logout
 * User logout endpoint - clears any server-side session/cookies
 */
router.post('/logout', (req, res) => {
  try {
    // Clear any authentication cookies that might be set
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    };

    // Clear common cookie names
    res.clearCookie('token', cookieOptions);
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Always return success for logout to ensure client can clear state
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

/**
 * GET /auth/verify
 * Cookie-based admin verification endpoint
 * Returns admin user details if authenticated with valid adminToken cookie
 */
// REMOVED_VERIFY_BY_COPILOT — verify handler removed per dev request. Rollback: restore original requireAuth, requireAdmin middleware and user details logic.
router.get('/verify', (req, res) => {
  return res.json({
    ok: true,
    data: { message: "verify removed" }
  });
});

export default router;

