/**
 * Admin Homepage Controller
 * Provides admin-only APIs to manage homepage brands and categories
 * Read-only endpoints for centralized homepage management
 */
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';

/**
 * GET /api/admin/homepage/brands
 * Returns all brands with homepage configuration fields
 * Sorted by homepageOrder (items with order appear first)
 */
export const getHomepageBrands = async (req, res) => {
  try {
    const brands = await Brand
      .find()
      .select('_id name slug isActive showOnHomepage homepageOrder')
      .sort({ homepageOrder: 1, name: 1 })
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: brands
    });
  } catch (error) {
    console.error('Admin homepage brands error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch brands for homepage management' },
      data: null
    });
  }
};

/**
 * GET /api/admin/homepage/categories
 * Returns all categories with homepage configuration fields
 * Sorted by homepageOrder (items with order appear first)
 */
export const getHomepageCategories = async (req, res) => {
  try {
    const categories = await Category
      .find()
      .select('_id name slug isActive showOnHomepage homepageOrder')
      .sort({ homepageOrder: 1, name: 1 })
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: categories
    });
  } catch (error) {
    console.error('Admin homepage categories error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch categories for homepage management' },
      data: null
    });
  }
};
