/**
 * Brand Alias Routes
 * Provides slug-based brand lookup
 * ADAPTERS: added by automation — safe wrapper
 * Generated: 2025-11-10
 */

import { Router } from 'express';
import Brand from '../models/Brand.js';

const router = Router();

/**
 * GET /brands/:slug
 * Get brand by slug (frontend expects this)
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ slug: req.params.slug });
    if (!brand) {
      return res.status(404).json({ 
        error: 'Brand not found',
        message: `No brand with slug "${req.params.slug}"` 
      });
    }
    res.json(brand);
  } catch (e) {
    next(e);
  }
});

export default router;
