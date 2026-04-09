/**
 * Homepage Controller (PUBLIC)
 * Place this file at: src/controllers/homepage.controller.js
 * REPLACES your existing homepage.controller.js
 */
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import HeroImage from '../models/HeroImage.js';
import HomepageSettings from '../models/HomepageSettings.js';
import HomepageSection from '../models/HomepageSection.js';

/**
 * GET /api/homepage/brands
 * Returns only brands marked showOnHomepage, sorted by homepageOrder
 */
export const getHomepageBrands = async (req, res) => {
  try {
    const brands = await Brand
      .find({ isActive: true, showOnHomepage: true })
      .select('_id name slug logo')
      .sort({ homepageOrder: 1, name: 1 })
      .limit(8)
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: brands,
    });
  } catch (error) {
    console.error('Homepage brands error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch homepage brands' },
      data: null,
    });
  }
};

/**
 * GET /api/homepage/categories
 * Returns only categories marked showOnHomepage, sorted by homepageOrder
 */
export const getHomepageCategories = async (req, res) => {
  try {
    const categories = await Category
      .find({ isActive: true, showOnHomepage: true })
      .select('_id name slug image')
      .sort({ homepageOrder: 1, name: 1 })
      .limit(12)
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: categories,
    });
  } catch (error) {
    console.error('Homepage categories error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch homepage categories' },
      data: null,
    });
  }
};

/**
 * GET /api/homepage/top-picks
 * Returns random/pinned products for the Top Picks section
 * Query: ?limit=8&offset=0&seed=12345
 */
export const getHomepageTopPicks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const offset = parseInt(req.query.offset) || 0;
    const seed = parseInt(req.query.seed) || Math.floor(Math.random() * 100000);

    const settings = await HomepageSettings.getSettings();

    // If there are pinned products, show them first
    if (settings?.pinnedProductIds?.length > 0 && offset === 0) {
      const pinnedProducts = await Product
        .find({
          _id: { $in: settings.pinnedProductIds },
          isActive: true,
        })
        .select('_id title slug images price mrp stock')
        .lean();

      // Preserve pinned order
      const ordered = settings.pinnedProductIds
        .map(id => pinnedProducts.find(p => p._id.toString() === id.toString()))
        .filter(Boolean);

      const totalCount = await Product.countDocuments({ isActive: true });

      return res.status(200).json({
        statusCode: 200,
        success: true,
        error: null,
        data: ordered.slice(0, limit),
        seed,
        hasMore: totalCount > limit,
      });
    }

    // Otherwise return random products using seed-based skip
    const totalCount = await Product.countDocuments({ isActive: true });
    const skipAmount = (seed + offset) % Math.max(totalCount - limit, 1);

    const products = await Product
      .find({ isActive: true })
      .select('_id title slug images price mrp stock')
      .skip(skipAmount)
      .limit(limit)
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: products,
      seed,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('Homepage top picks error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch top picks' },
      data: null,
    });
  }
};

/**
 * GET /api/homepage/hero-images
 * Returns active hero images sorted by displayOrder
 */
export const getHeroImages = async (req, res) => {
  try {
    const heroImages = await HeroImage
      .find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: heroImages,
    });
  } catch (error) {
    console.error('Hero images error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch hero images' },
      data: null,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ NEW: Public sections endpoint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/homepage/sections
 * Returns all active homepage sections with their resolved products/categories/brands.
 * For sectionType=products  → resolves productIds into full product objects
 *                             OR queries products by categoryIds/brandIds filters
 * For sectionType=categories → resolves categoryIds into full category objects
 * For sectionType=brands     → resolves brandIds into full brand objects
 */
export const getHomepageSections = async (req, res) => {
  try {
    // Fetch only active sections, sorted by displayOrder
    const sections = await HomepageSection.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    // Resolve each section's content
    const resolved = await Promise.all(
      sections.map(async (section) => {
        try {
          if (section.sectionType === 'categories') {
            // Return category objects
            const categories = await Category
              .find({
                _id: { $in: section.categoryIds },
                isActive: true,
              })
              .select('_id name slug image')
              .lean();

            return { ...section, items: categories };
          }

          if (section.sectionType === 'brands') {
            // Return brand objects
            const brands = await Brand
              .find({
                _id: { $in: section.brandIds },
                isActive: true,
              })
              .select('_id name slug logo')
              .lean();

            return { ...section, items: brands };
          }

          // Default: sectionType === 'products'
          // If specific productIds are pinned, use those first
          if (section.productIds && section.productIds.length > 0) {
            const products = await Product
              .find({
                _id: { $in: section.productIds },
                isActive: true,
              })
              .select('_id title slug images price mrp stock')
              .lean();

            // Preserve pinned order
            const ordered = section.productIds
              .map(id =>
                products.find(p => p._id.toString() === id.toString())
              )
              .filter(Boolean);

            return { ...section, items: ordered };
          }

          // No pinned products — build a filter query from categoryIds / brandIds
          const productQuery = { isActive: true };

          if (section.categoryIds && section.categoryIds.length > 0) {
            productQuery.category = { $in: section.categoryIds };
          }
          if (section.brandIds && section.brandIds.length > 0) {
            productQuery.brand = { $in: section.brandIds };
          }

          // Apply discount filter if set
          if (section.discountType === 'percentage' || section.discountType === 'flat') {
            if (section.minDiscount != null) {
              productQuery.discount = { $gte: section.minDiscount };
            }
            if (section.maxDiscount != null) {
              productQuery.discount = {
                ...(productQuery.discount || {}),
                $lte: section.maxDiscount,
              };
            }
          }

          const products = await Product
            .find(productQuery)
            .select('_id title slug images price mrp stock')
            .limit(20)
            .lean();

          return { ...section, items: products };
        } catch (sectionError) {
          console.error(`Error resolving section ${section._id}:`, sectionError);
          return { ...section, items: [] };
        }
      })
    );

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: resolved,
    });
  } catch (error) {
    console.error('getHomepageSections error:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to fetch homepage sections' },
      data: [],
    });
  }
};