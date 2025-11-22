/**
 * Root-level Alias Routes
 * Provides top-level /me and /profile endpoints
 * ADAPTERS: added by automation — safe wrapper
 * Generated: 2025-11-10
 */

import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import User from '../models/User.js';

const router = Router();

/**
 * GET /me
 * Alias for /users/me at root level
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
 * GET /profile
 * Alias for /users/me at root level
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
