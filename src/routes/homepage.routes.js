/**
 * Homepage Public Routes
 * Place this file at: src/routes/homepage.routes.js
 * REPLACES your existing homepage.routes.js
 */
import { Router } from 'express';
import {
  getHomepageBrands,
  getHomepageCategories,
  getHomepageTopPicks,
  getHeroImages,
  getHomepageSections,   // ✅ NEW
} from '../controllers/homepage.controller.js';

const router = Router();

// GET /api/homepage/brands
router.get('/brands', getHomepageBrands);

// GET /api/homepage/categories
router.get('/categories', getHomepageCategories);

// GET /api/homepage/top-picks
router.get('/top-picks', getHomepageTopPicks);

// GET /api/homepage/hero-images
router.get('/hero-images', getHeroImages);

// ✅ NEW: GET /api/homepage/sections
// Returns all active sections with resolved items (products / categories / brands)
router.get('/sections', getHomepageSections);

export default router;