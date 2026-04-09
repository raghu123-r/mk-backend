/**
 * Admin Homepage Routes
 * Place this file at: src/routes/admin.homepage.routes.js
 * REPLACES your existing admin.homepage.routes.js
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
import {
  getSections,
  createSection,
  reorderSections,
  getSectionById,
  updateSection,
  deleteSection,
} from '../controllers/admin.homepage.sections.controller.js';

const router = Router();

// All routes require admin authentication
router.use(requireAuth, requireAdmin);

// ── Existing routes (DO NOT CHANGE THESE) ────────────────────────────────────

// GET /api/admin/homepage/brands
router.get('/brands', getHomepageBrands);

// GET /api/admin/homepage/categories
router.get('/categories', getHomepageCategories);

// GET /api/admin/homepage/top-picks
router.get('/top-picks', getTopPicksConfig);

// PUT /api/admin/homepage/top-picks
router.put('/top-picks', updateTopPicksConfig);

// GET /api/admin/homepage/products-search
router.get('/products-search', searchProductsForTopPicks);

// ── NEW: Homepage Sections CRUD ───────────────────────────────────────────────

// GET  /api/admin/homepage/sections
router.get('/sections', getSections);

// POST /api/admin/homepage/sections
router.post('/sections', createSection);

// PUT  /api/admin/homepage/sections/reorder
// ⚠️  MUST stay ABOVE the /:id route or Express will treat "reorder" as an ID
router.put('/sections/reorder', reorderSections);

// GET  /api/admin/homepage/sections/:id
router.get('/sections/:id', getSectionById);

// PUT  /api/admin/homepage/sections/:id
router.put('/sections/:id', updateSection);

// DELETE /api/admin/homepage/sections/:id
router.delete('/sections/:id', deleteSection);

export default router;