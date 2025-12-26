/**
 * Admin Homepage Routes
 * Admin-only endpoints for managing homepage brands and categories
 */
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  getHomepageBrands,
  getHomepageCategories
} from '../controllers/admin.homepage.controller.js';

const router = Router();

// All routes require admin authentication
router.use(requireAuth, requireAdmin);

// GET /api/admin/homepage/brands - Fetch all brands with homepage fields
router.get('/brands', getHomepageBrands);

// GET /api/admin/homepage/categories - Fetch all categories with homepage fields
router.get('/categories', getHomepageCategories);

export default router;
