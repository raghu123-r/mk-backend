/**
 * Brand Alias Routes
 * Provides slug-based brand lookup
 * ADAPTERS: added by automation — safe wrapper
 * Generated: 2025-11-10
 * Updated: 2025-11-29 - Enhanced with robust slug lookup
 */

import { Router } from 'express';
import Brand from '../models/Brand.js';
import mongoose from 'mongoose';

const router = Router();

/**
 * Normalize slug for comparison
 */
function normalizeSlug(input) {
  if (!input) return '';
  return decodeURIComponent(input).trim().toLowerCase();
}

/**
 * Generate slug variations for fallback matching
 */
function slugVariations(slug) {
  const normalized = normalizeSlug(slug);
  return [
    normalized,
    normalized.replace(/\s+/g, '-'),
    normalized.replace(/\s+/g, '_'),
    normalized.replace(/_/g, '-'),
    normalized.replace(/-/g, ' ')
  ];
}

/**
 * GET /brands/:slug
 * Get brand by slug with robust fallback logic
 * Tries: exact slug, variations, ObjectId, name matching
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // 1. Try exact slug match
    const normalized = normalizeSlug(slug);
    let brand = await Brand.findOne({ slug: normalized });
    if (brand) {
      console.log(`✅ Brand found by exact slug: ${normalized}`);
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: brand
      });
    }

    // 2. Try slug variations (hyphens, underscores, spaces)
    const variations = slugVariations(slug);
    for (const variant of variations) {
      brand = await Brand.findOne({ slug: variant });
      if (brand) {
        console.log(`✅ Brand found by slug variation: ${variant}`);
        return res.status(200).json({
          statusCode: 200,
          success: true,
          error: null,
          data: brand
        });
      }
    }

    // 3. Try as ObjectId
    if (mongoose.Types.ObjectId.isValid(slug)) {
      brand = await Brand.findById(slug);
      if (brand) {
        console.log(`✅ Brand found by ObjectId: ${slug}`);
        return res.status(200).json({
          statusCode: 200,
          success: true,
          error: null,
          data: brand
        });
      }
    }

    // 4. Fallback: fetch all brands and match by slugified name
    const allBrands = await Brand.find().lean();
    for (const b of allBrands) {
      const slugifiedName = normalizeSlug(b.name);
      if (variations.includes(slugifiedName) || slugifiedName === normalized) {
        console.log(`✅ Brand found by name matching: ${b.name}`);
        return res.status(200).json({
          statusCode: 200,
          success: true,
          error: null,
          data: b
        });
      }
    }

    // Not found after all attempts
    console.log(`❌ Brand not found for: ${slug}`);
    return res.status(404).json({
      statusCode: 404,
      success: false,
      error: { message: `No brand with slug "${slug}"` },
      data: null
    });
  } catch (error) {
    console.error('❌ Error in brand slug lookup:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Internal server error' },
      data: null
    });
  }
});

export default router;
