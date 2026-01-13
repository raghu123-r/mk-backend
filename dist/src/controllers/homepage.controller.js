/**
 * Homepage controller
 * Lightweight, optimized endpoints for homepage data
 * Returns minimal fields to reduce payload size
 */
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import HeroImage from '../models/HeroImage.js';
import HomepageSettings from '../models/HomepageSettings.js';

/**
 * GET /api/homepage/brands
 * Returns exactly 4 active brands with minimal fields
 * Filtered by admin-selected homepage priority
 */
export const getHomepageBrands = async (req, res) => {
  try {
    const brands = await Brand
      .find({ isActive: true, showOnHomepage: true })
      .select('_id name slug logoUrl homepageOrder')
      .sort({ homepageOrder: 1 }) // Sort by priority order
      .limit(4)
      .lean();
      
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: brands
    });
  } catch (error) {
    console.error('Homepage brands error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch homepage brands' },
      data: []
    });
  }
};

/**
 * GET /api/homepage/categories
 * Returns exactly 4 active categories with minimal fields
 * Filtered by admin-selected homepage priority
 */
export const getHomepageCategories = async (req, res) => {
  try {
    const categories = await Category
      .find({ isActive: true, showOnHomepage: true })
      .select('_id name slug image image_url homepageOrder')
      .sort({ homepageOrder: 1 }) // Sort by priority order
      .limit(4)
      .lean();

    // Normalize image field
    const normalized = categories.map(c => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.image_url || c.image || ''
    }));

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: normalized
    });
  } catch (error) {
    console.error('Homepage categories error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch homepage categories' },
      data: []
    });
  }
};

/**
 * GET /api/homepage/top-picks
 * Returns products with pagination support for infinite scroll
 * First batch (offset=0): Admin-pinned products first, then random to fill 8 slots
 * Subsequent batches: Random products only (excluding pinned ones)
 * Query params:
 * - limit: number of products per page (default: 8)
 * - offset: number of products to skip (default: 0)
 * - seed: random seed for consistent session randomization (optional)
 * Max total: 40 products
 */
export const getHomepageTopPicks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 40);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const seed = req.query.seed ? parseFloat(req.query.seed) : Math.random();

    // Cap total results at 40 products
    const maxProducts = 40;
    if (offset >= maxProducts) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: [],
        hasMore: false,
        total: maxProducts
      });
    }

    // Get admin pinned products config
    const settings = await HomepageSettings.getSettings();
    const pinnedIds = settings.pinnedProductIds || [];
    const pinnedIdsSet = new Set(pinnedIds.map(id => id.toString()));

    // Adjust limit if offset + limit exceeds max
    const adjustedLimit = Math.min(limit, maxProducts - offset);

    // FIRST BATCH (offset=0): Include pinned products at the start
    if (offset === 0) {
      // Fetch pinned products (maintaining order)
      let pinnedProducts = [];
      if (pinnedIds.length > 0) {
        const pinnedDocs = await Product
          .find({ _id: { $in: pinnedIds }, isActive: true })
          .select('_id title slug images price mrp stock')
          .lean();
        
        // Preserve admin-defined order
        pinnedProducts = pinnedIds
          .map(id => pinnedDocs.find(p => p._id.toString() === id.toString()))
          .filter(Boolean);
      }

      // Calculate how many random products needed to fill the batch
      const pinnedCount = pinnedProducts.length;
      const randomNeeded = Math.max(0, adjustedLimit - pinnedCount);

      let randomProducts = [];
      if (randomNeeded > 0) {
        // Fetch random products excluding pinned ones
        const excludeIds = pinnedIds.length > 0 ? pinnedIds : [];
        const totalCount = await Product.countDocuments({ 
          isActive: true, 
          _id: { $nin: excludeIds } 
        });

        if (totalCount > 0) {
          const poolSize = Math.min(totalCount, maxProducts * 2);
          
          // Seed-based random skip
          const seededRandom = () => {
            const x = Math.sin(seed * 9999) * 10000;
            return x - Math.floor(x);
          };
          const randomSkip = Math.floor(seededRandom() * Math.max(0, totalCount - poolSize));

          const productPool = await Product
            .find({ isActive: true, _id: { $nin: excludeIds } })
            .select('_id title slug images price mrp stock')
            .skip(randomSkip)
            .limit(poolSize)
            .lean();

          // Shuffle with seed
          const shuffled = shuffleWithSeed(productPool, seed);
          randomProducts = shuffled.slice(0, randomNeeded);
        }
      }

      // Combine: pinned first, then random
      const result = [...pinnedProducts, ...randomProducts];
      
      const hasMore = adjustedLimit < maxProducts && (pinnedCount + randomProducts.length) >= adjustedLimit;

      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: result,
        hasMore,
        total: maxProducts,
        seed,
        pinnedCount // Tell frontend how many are pinned (for reference)
      });
    }

    // SUBSEQUENT BATCHES (offset > 0): Only random products, exclude pinned
    const excludeIds = pinnedIds.length > 0 ? pinnedIds : [];
    const totalCount = await Product.countDocuments({ 
      isActive: true, 
      _id: { $nin: excludeIds } 
    });

    if (totalCount === 0) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: [],
        hasMore: false,
        total: 0
      });
    }

    const poolSize = Math.min(totalCount, maxProducts * 2);
    
    const seededRandom = () => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    const randomSkip = Math.floor(seededRandom() * Math.max(0, totalCount - poolSize));

    const productPool = await Product
      .find({ isActive: true, _id: { $nin: excludeIds } })
      .select('_id title slug images price mrp stock')
      .skip(randomSkip)
      .limit(poolSize)
      .lean();

    const shuffled = shuffleWithSeed(productPool, seed);
    
    // For subsequent batches, adjust offset to account for pinned products in first batch
    // Since first batch had pinnedCount pinned + (limit - pinnedCount) random,
    // the effective random offset is: offset - (first batch random count)
    // But since we want consistent pagination, we just slice from offset position
    // in the shuffled array (excluding what was shown in first batch)
    const pinnedCount = pinnedIds.length;
    const firstBatchRandomCount = Math.min(limit, maxProducts) - Math.min(pinnedCount, limit);
    const effectiveRandomOffset = offset - Math.min(pinnedCount, limit);
    
    // Slice from the shuffled pool
    const startIndex = effectiveRandomOffset > 0 ? effectiveRandomOffset : 0;
    const paginatedProducts = shuffled.slice(startIndex, startIndex + adjustedLimit);

    const hasMore = (offset + adjustedLimit) < maxProducts && (startIndex + adjustedLimit) < shuffled.length;

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: paginatedProducts,
      hasMore,
      total: Math.min(shuffled.length + pinnedCount, maxProducts),
      seed
    });
  } catch (error) {
    console.error('Homepage top picks error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch homepage products' },
      data: [],
      hasMore: false
    });
  }
};

// Helper: Deterministic shuffle using seed
function shuffleWithSeed(array, seedValue) {
  const shuffled = [...array];
  let currentSeed = seedValue;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const x = Math.sin(currentSeed * (i + 1)) * 10000;
    const random = x - Math.floor(x);
    const j = Math.floor(random * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    currentSeed = random;
  }
  
  return shuffled;
}

/**
 * GET /api/homepage/hero-images
 * Returns active hero images for homepage carousel
 * Optimized for fast page load - returns minimal fields and limited images
 */
export const getHeroImages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const heroImages = await HeroImage
      .find({ isActive: true })
      .select('_id title subtitle imageUrl displayOrder')
      .sort({ displayOrder: 1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: heroImages
    });
  } catch (error) {
    console.error('Homepage hero images error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch hero images' },
      data: []
    });
  }
};
