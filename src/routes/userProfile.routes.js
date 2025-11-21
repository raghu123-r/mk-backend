/**
 * User Profile Routes
 * 
 * Routes for user profile viewing and editing
 * All routes require authentication via protect middleware
 */

import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { getProfile, updateProfile } from '../controllers/userProfile.controller.js';
import { 
  updateProfileRules, 
  handleValidationErrors 
} from '../validators/userProfile.validator.js';

const router = Router();

/**
 * GET /user/profile
 * Get authenticated user's profile
 * @auth Required
 */
router.get('/profile', protect, getProfile);

/**
 * PATCH /user/profile
 * Update authenticated user's profile
 * @auth Required
 * @body {name?, email?, phone?}
 */
router.patch(
  '/profile',
  protect,
  updateProfileRules,
  handleValidationErrors,
  updateProfile
);

export default router;
