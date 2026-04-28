/**
 * Homepage Controller (PUBLIC)
 * Place this file at: src/controllers/homepage.controller.js
 */
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import HeroImage from '../models/HeroImage.js';
import HomepageSettings from '../models/HomepageSettings.js';
import HomepageSection from '../models/HomepageSection.js';

/**
 * GET /api/homepage/brands
 */
export const getHomepageBrands = async (req, res) => {
  try {
    const brands = await Brand
      .find({ isActive: true, showOnHomepage: true })
      .select('_id name slug logoUrl') // ✅ FIXED: was 'logo', model field is 'logoUrl'
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
 */
export const getHomepageCategories = async (req, res) => {
  try {
    const categories = await Category
      .find({ isActive: true, showOnHomepage: true })
      .select('_id name slug image image_url') // ✅ FIXED: select both fields
      .sort({ homepageOrder: 1, name: 1 })
      .limit(12)
      .lean();

    // ✅ Normalize: always expose imageUrl field to frontend
    const normalized = categories.map((c) => ({
      ...c,
      imageUrl: c.image_url || c.image || '',
    }));

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: normalized,
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
 */
export const getHomepageTopPicks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const offset = parseInt(req.query.offset) || 0;
    const seed = parseInt(req.query.seed) || Math.floor(Math.random() * 100000);

    const settings = await HomepageSettings.getSettings();

    if (settings?.pinnedProductIds?.length > 0 && offset === 0) {
      const pinnedProducts = await Product
        .find({
          _id: { $in: settings.pinnedProductIds },
          isActive: true,
        })
        .select('_id title slug images price mrp stock')
        .lean();

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

/**
 * GET /api/homepage/sections
 */
export const getHomepageSections = async (req, res) => {
  try {
    const sections = await HomepageSection.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    const resolved = await Promise.all(
      sections.map(async (section) => {
        try {
          if (section.sectionType === 'categories') {
            const categories = await Category
              .find({
                _id: { $in: section.categoryIds },
                isActive: true,
              })
              .select('_id name slug image image_url') // ✅ FIXED: select both fields
              .lean();

            const normalized = categories.map((c) => ({
              ...c,
              imageUrl: c.image_url || c.image || '',
            }));

            return { ...section, items: normalized };
          }

          if (section.sectionType === 'brands') {
            const brands = await Brand
              .find({
                _id: { $in: section.brandIds },
                isActive: true,
              })
              .select('_id name slug logoUrl') // ✅ FIXED: was 'logo', model field is 'logoUrl'
              .lean();

            return { ...section, items: brands };
          }

          // Default: sectionType === 'products'
          if (section.productIds && section.productIds.length > 0) {
            const products = await Product
              .find({
                _id: { $in: section.productIds },
                isActive: true,
              })
              .select('_id title slug images price mrp stock')
              .lean();

            const ordered = section.productIds
              .map(id =>
                products.find(p => p._id.toString() === id.toString())
              )
              .filter(Boolean);

            return { ...section, items: ordered };
          }

          const productQuery = { isActive: true };

          if (section.categoryIds && section.categoryIds.length > 0) {
            productQuery.category = { $in: section.categoryIds };
          }
          if (section.brandIds && section.brandIds.length > 0) {
            productQuery.brand = { $in: section.brandIds };
          }

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