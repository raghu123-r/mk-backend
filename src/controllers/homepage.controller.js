/**
 * Homepage controller
 * Lightweight, optimized endpoints for homepage data
 * Returns minimal fields to reduce payload size
 */
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import HeroImage from '../models/HeroImage.js';

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
 * Returns random products with pagination support for infinite scroll
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

    // Adjust limit if offset + limit exceeds max
    const adjustedLimit = Math.min(limit, maxProducts - offset);

    // Get total count of active products
    const totalCount = await Product.countDocuments({ isActive: true });

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

    // For session consistency, use seed to generate deterministic random order
    // Fetch up to maxProducts (40) and shuffle using seed
    const poolSize = Math.min(totalCount, maxProducts * 2); // Larger pool for better randomness
    
    // Use seed-based random skip
    const seededRandom = () => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    
    const randomSkip = Math.floor(seededRandom() * Math.max(0, totalCount - poolSize));

    // Fetch a pool of products
    const productPool = await Product
      .find({ isActive: true })
      .select('_id title slug images price mrp stock')
      .skip(randomSkip)
      .limit(poolSize)
      .lean();

    // Create deterministic shuffle using seed
    const shuffleWithSeed = (array, seedValue) => {
      const shuffled = [...array];
      let currentSeed = seedValue;
      
      for (let i = shuffled.length - 1; i > 0; i--) {
        // Generate deterministic random number
        const x = Math.sin(currentSeed * (i + 1)) * 10000;
        const random = x - Math.floor(x);
        const j = Math.floor(random * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        currentSeed = random; // Update seed for next iteration
      }
      
      return shuffled;
    };

    // Shuffle using seed and slice based on offset/limit
    const shuffled = shuffleWithSeed(productPool, seed);
    const paginatedProducts = shuffled.slice(offset, offset + adjustedLimit);

    const hasMore = (offset + adjustedLimit) < maxProducts && (offset + adjustedLimit) < shuffled.length;

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: paginatedProducts,
      hasMore,
      total: Math.min(shuffled.length, maxProducts),
      seed // Return seed so frontend can use it for subsequent requests
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
