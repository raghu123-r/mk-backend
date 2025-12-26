/**
 * Homepage-specific lightweight routes
 * Returns minimal data optimized for homepage initial load
 */
import { Router } from 'express';
import {
  getHomepageBrands,
  getHomepageCategories,
  getHomepageTopPicks
} from '../controllers/homepage.controller.js';

const router = Router();

// GET /api/homepage/brands - Return only 4 brands for homepage
router.get('/brands', getHomepageBrands);

// GET /api/homepage/categories - Return only 4 categories for homepage
router.get('/categories', getHomepageCategories);

// GET /api/homepage/top-picks - Return random products for homepage
router.get('/top-picks', getHomepageTopPicks);

export default router;
