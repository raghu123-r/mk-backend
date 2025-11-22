/**
 * Authentication Alias Routes
 * Provides frontend-compatible endpoints that wrap existing auth service
 * ADAPTERS: added by automation — safe wrapper
 * Generated: 2025-11-10
 */

import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import * as authService from '../services/auth.service.js';
import User from '../models/User.js';

const router = Router();

/**
 * POST /auth/login
 * Alias for traditional login flow - returns helpful error since backend uses OTP
 * Frontend should migrate to OTP flow, but this provides clear messaging
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, otp } = req.body;
    
    // If OTP provided, forward to verify-otp
    if (otp) {
      const data = await authService.verifyOtp({ 
        email, 
        code: otp, 
        purpose: 'login' 
      });
      return res.json({ 
        token: data.access, 
        user: data.user 
      });
    }
    
    // Password-based login not supported
    return res.status(400).json({
      error: 'Password login not supported. Please use OTP flow: POST /auth/request-otp then /auth/verify-otp',
      message: 'This backend uses OTP-based authentication',
      migration: {
        step1: 'POST /auth/request-otp with { email }',
        step2: 'POST /auth/verify-otp with { email, code }'
      }
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /auth/register
 * Alias for signup - wraps OTP verify with purpose='signup'
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, name, otp, code } = req.body;
    
    if (!otp && !code) {
      return res.status(400).json({
        error: 'OTP required for registration',
        message: 'First call POST /auth/request-otp with { email, purpose: "signup" }',
        migration: {
          step1: 'POST /auth/request-otp with { email, purpose: "signup" }',
          step2: 'POST /auth/register with { email, name, otp }'
        }
      });
    }
    
    const data = await authService.verifyOtp({ 
      email, 
      code: otp || code, 
      purpose: 'signup',
      name 
    });
    
    return res.json({ 
      token: data.access, 
      user: data.user 
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /auth/signup
 * Alias for /auth/register
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, name, otp, code } = req.body;
    
    if (!otp && !code) {
      return res.status(400).json({
        error: 'OTP required for signup',
        message: 'First call POST /auth/request-otp with { email, purpose: "signup" }'
      });
    }
    
    const data = await authService.verifyOtp({ 
      email, 
      code: otp || code, 
      purpose: 'signup',
      name 
    });
    
    return res.json({ 
      token: data.access, 
      user: data.user 
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /auth/me
 * Alias for GET /users/me - returns current user profile
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /auth/profile
 * Alias for GET /users/me
 */
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (e) {
    next(e);
  }
});

export default router;
