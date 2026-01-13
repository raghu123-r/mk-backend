/**
 * Admin Homepage Routes
 * Admin-only endpoints for managing homepage brands and categories
 */
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  getHomepageBrands,
  getHomepageCategories,
  getTopPicksConfig,
  updateTopPicksConfig,
  searchProductsForTopPicks
} from '../controllers/admin.homepage.controller.js';

const router = Router();

// All routes require admin authentication
router.use(requireAuth, requireAdmin);

// GET /api/admin/homepage/brands - Fetch all brands with homepage fields
router.get('/brands', getHomepageBrands);

// GET /api/admin/homepage/categories - Fetch all categories with homepage fields
router.get('/categories', getHomepageCategories);

// GET /api/admin/homepage/top-picks - Get current pinned products config
router.get('/top-picks', getTopPicksConfig);

// PUT /api/admin/homepage/top-picks - Update pinned products
router.put('/top-picks', updateTopPicksConfig);

// GET /api/admin/homepage/products-search - Search products for selection
router.get('/products-search', searchProductsForTopPicks);

export default router;
