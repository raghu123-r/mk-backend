/**
 * Homepage controller
 * Lightweight, optimized endpoints for homepage data
 * Returns minimal fields to reduce payload size
 */
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

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
 * Returns random products on each request (backend-driven randomness)
 * Default: 8 products
 */
export const getHomepageTopPicks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    // Get total count of active products
    const totalCount = await Product.countDocuments({ isActive: true });

    if (totalCount === 0) {
      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: []
      });
    }

    // Calculate how many products to fetch for randomization pool
    // Use a larger pool to ensure better randomness
    const poolSize = Math.min(totalCount, limit * 3);
    const randomSkip = Math.floor(Math.random() * Math.max(0, totalCount - poolSize));

    // Fetch a pool of products and randomly select from them
    const productPool = await Product
      .find({ isActive: true })
      .select('_id title slug images price mrp stock')
      .skip(randomSkip)
      .limit(poolSize)
      .lean();

    // Shuffle the pool and take the requested limit
    const shuffled = productPool.sort(() => Math.random() - 0.5);
    const randomProducts = shuffled.slice(0, limit);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: randomProducts
    });
  } catch (error) {
    console.error('Homepage top picks error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch homepage products' },
      data: []
    });
  }
};
