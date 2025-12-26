// kk-backend/src/controllers/brand.controller.js
import { z } from 'zod';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import url from 'url';
import { getPublicUrlForPath, supabaseAdmin } from '../lib/supabaseAdmin.js';

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    logoUrl: z.string().url().optional()
  })
});

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    logoUrl: z.string().url().optional(),
    showOnHomepage: z.boolean().optional(),
    homepageOrder: z.number().min(1).max(4).optional()
  })
  .refine(
    (data) => {
      // If homepageOrder is set, showOnHomepage must be true
      if (data.homepageOrder !== undefined && !data.showOnHomepage) {
        return false;
      }
      return true;
    },
    {
      message: 'homepageOrder can only be set when showOnHomepage is true'
    }
  )
});

/**
 * Environment-driven config
 */
const SUPABASE_URL = process.env.SUPABASE_URL || ''; // e.g. https://<project>.supabase.co
const SUPABASE_IMAGES_BUCKET = process.env.SUPABASE_IMAGES_BUCKET || 'product-images';

/**
 * Normalize slug for comparison
 */
function normalizeSlug(input) {
  if (!input) return '';
  try {
    return decodeURIComponent(String(input)).trim().toLowerCase();
  } catch (e) {
    return String(input).trim().toLowerCase();
  }
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
 * Robust brand lookup by slug or ID
 */
async function findBrandBySlugOrId(slugOrId) {
  try {
    const normalized = normalizeSlug(slugOrId);

    // 1. exact slug match
    let brand = await Brand.findOne({ slug: normalized });
    if (brand) {
      console.log(`✅ Brand found by exact slug: ${normalized}`);
      return brand;
    }

    // 2. slug variations
    const variations = slugVariations(slugOrId);
    for (const variant of variations) {
      brand = await Brand.findOne({ slug: variant });
      if (brand) {
        console.log(`✅ Brand found by slug variation: ${variant}`);
        return brand;
      }
    }

    // 3. ObjectId
    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      brand = await Brand.findById(slugOrId);
      if (brand) {
        console.log(`✅ Brand found by ObjectId: ${slugOrId}`);
        return brand;
      }
    }

    // 4. Fallback: name matching
    const allBrands = await Brand.find().lean();
    for (const b of allBrands) {
      const slugifiedName = normalizeSlug(b.name);
      if (slugVariations(slugOrId).includes(slugifiedName) || slugifiedName === normalized) {
        console.log(`✅ Brand found by name matching: ${b.name}`);
        return b;
      }
    }

    console.log(`❌ Brand not found for: ${slugOrId}`);
    return null;
  } catch (error) {
    console.error('❌ Error in findBrandBySlugOrId:', error);
    throw error;
  }
}


/**
 * Helper: try to find a logo file in `product-images/brands/<slug>/` (returns publicUrl or null)
 */
async function findLogoForSlug(slug) {
  if (!slug) return null;
  const bucket = process.env.SUPABASE_BUCKET || 'product-images';
  // candidate filenames in priority order
  const candidates = ['logo.png', 'logo.jpg', 'Logo.png', 'logo.jpeg', 'logo.webp', 'logo.svg'];
  for (const name of candidates) {
    try {
      const candidatePath = `brands/${slug}/${name}`;
      const publicUrl = getPublicUrlForPath(bucket, candidatePath);
      if (publicUrl) {
        // verify exists by HEAD to avoid returning non-existent paths
        try {
          const res = await fetch(publicUrl, { method: 'HEAD' });
          if (res.ok) return publicUrl;
        } catch (e) {
          // ignore and continue to next candidate
        }
      }
    } catch (e) {
      // ignore candidate
    }
  }
  return null;
}

/**
 * Build a public URL for a brand logo using Supabase storage public path.
 * Enhanced: robust normalization + attempt storage listing/fallback
 * Prevents returning broken URLs like /brands/logo.png (missing slug)
 */
async function buildLogoUrl(brand) {
  const rawVal = (brand && (brand.logoUrl || brand.logo_url || brand.logo)) ? String(brand.logoUrl || brand.logo_url || brand.logo).trim() : '';
  
  if (!rawVal) {
    // try to find by slug if no raw value
    const slug = brand && brand.slug ? String(brand.slug).trim() : null;
    if (slug) {
      const found = await findLogoForSlug(slug);
      return found || null;
    }
    return null;
  }

  // If supplied absolute URL and NOT a via.placeholder -> check for broken paths
  if (/^https?:\/\//i.test(rawVal)) {
    if (rawVal.includes('via.placeholder.com')) return null;
    
    // If URL appears to be missing slug (e.g., /brands/logo.png), try to find slug fallback
    try {
      const u = new URL(rawVal);
      // if the path ends with '/brands/logo.png' (no slug), try fallback
      if (u.pathname && u.pathname.match(/\/brands\/logo\.(png|jpg|jpeg|svg|webp)$/i)) {
        const slug = brand && brand.slug ? String(brand.slug).trim() : null;
        if (slug) {
          const found = await findLogoForSlug(slug);
          if (found) return found;
        }
        return null; // don't return the broken brands/logo.png
      }
    } catch (e) {
      // continue and just return rawVal
    }
    return rawVal;
  }

  // Not an absolute URL -> treat as storage path
  try {
    const bucket = process.env.SUPABASE_BUCKET || 'product-images';
    let path = rawVal.replace(/^\/+/, ''); // remove leading slashes
    
    // If path looks like 'brands/logo.png' (no slug) or just 'logo.png', resolve by slug
    if (/^brands\/logo\.(png|jpg|jpeg|svg|webp)$/i.test(path) || /^logo\.(png|jpg|jpeg|svg|webp)$/i.test(path)) {
      const slug = brand && brand.slug ? String(brand.slug).trim() : null;
      if (slug) {
        const found = await findLogoForSlug(slug);
        if (found) return found;
      }
      // path has no slug, don't return broken URL
      return null;
    }

    // path looks specific (e.g., brands/home-essentials/logo.png)
    if (/^brands\/[^/]+\/.+$/.test(path)) {
      const publicUrl = getPublicUrlForPath(bucket, path);
      return publicUrl || null;
    }

    // otherwise, try slug fallback
    const slug = brand && brand.slug ? String(brand.slug).trim() : null;
    if (slug) {
      const found = await findLogoForSlug(slug);
      if (found) return found;
    }

    // last attempt: combine bucket path and raw path (only if it has subfolder structure)
    if (path.includes('/') && !path.match(/^brands\/logo\./i)) {
      const fallback = getPublicUrlForPath(bucket, path);
      return fallback || null;
    }
    
    return null;
  } catch (err) {
    console.warn('buildLogoUrl error:', err);
    return null;
  }
}

/**
 * Map a brand (Mongoose doc or plain object) to response object with normalized logoUrl
 * If logoUrl is missing or broken, set to null.
 */
async function mapBrandForResponseAsync(b) {
  const brand = (b && b.toObject) ? b.toObject() : b;
  if (!brand) return null;
  const logoUrl = await buildLogoUrl(brand);
  // ensure we never return a "brands/logo.png" path without slug
  if (logoUrl && /\/brands\/logo\.(png|jpg|jpeg|svg|webp)$/i.test(logoUrl)) {
    // prefer null than a broken path
    return { ...brand, logoUrl: null };
  }
  return { ...brand, logoUrl: logoUrl || null };
}

/* ------------------- Controller actions ------------------- */

export const create = async (req, res, next) => {
  try {
    const b = await Brand.create(req.body);
    const mapped = await mapBrandForResponseAsync(b);
    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: mapped
    });
  } catch (e) { next(e); }
};

export const list = async (_req, res, next) => {
  try {
    // Public endpoint: only return active brands
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();
    const mapped = await Promise.all((brands || []).map(mapBrandForResponseAsync));
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapped
    });
  } catch (e) { next(e); }
};

export const listAll = async (req, res, next) => {
  try {
    // Admin endpoint: return ALL brands including disabled ones with advanced search & filters
    const {
      page = 1,
      limit = 5,
      search = '',
      status = ''
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Support large limits for backward compatibility (e.g., 9999 for "all")
    const effectiveLimit = limitNum > 0 ? limitNum : 5;

    // Build filter query
    const filterQuery = {};

    // Global search on brand name
    if (search && search.trim()) {
      filterQuery.name = { $regex: search.trim(), $options: 'i' };
    }

    // Status filter (active/inactive)
    if (status && status.trim()) {
      if (status === 'active') {
        filterQuery.isActive = true;
      } else if (status === 'inactive') {
        filterQuery.isActive = false;
      }
    }

    // Execute query with filters and pagination
    const [brands, total] = await Promise.all([
      Brand.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(effectiveLimit)
        .lean(),
      Brand.countDocuments(filterQuery)
    ]);

    const totalPages = Math.ceil(total / effectiveLimit);
    const mapped = await Promise.all((brands || []).map(mapBrandForResponseAsync));

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        brands: mapped,
        total,
        page: pageNum,
        totalPages,
        limit: effectiveLimit,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
  try {
    const brand = await findBrandBySlugOrId(req.params.id);

    if (!brand) return res.status(404).json({
      statusCode: 404,
      success: false,
      error: { message: 'Brand not found' },
      data: null
    });

    // Public endpoint: only return if active
    if (!brand.isActive) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Brand not found' },
        data: null
      });
    }

    const mapped = await mapBrandForResponseAsync(brand);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapped
    });
  } catch (e) {
    console.error('❌ getById error:', e);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Internal server error' },
      data: null
    });
  }
};

export const update = async (req, res, next) => {
  try {
    // Check for duplicate homepageOrder if being set
    if (req.body.showOnHomepage && req.body.homepageOrder !== undefined) {
      const existingBrand = await Brand.findOne({
        _id: { $ne: req.params.id },
        showOnHomepage: true,
        homepageOrder: req.body.homepageOrder
      });
      
      if (existingBrand) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: `Homepage order ${req.body.homepageOrder} is already assigned to brand "${existingBrand.name}"` },
          data: null
        });
      }
    }

    // If disabling homepage visibility, clear the order
    if (req.body.showOnHomepage === false) {
      req.body.homepageOrder = null;
    }

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!brand) return res.status(404).json({
      statusCode: 404,
      success: false,
      error: { message: 'Brand not found' },
      data: null
    });
    const mapped = await mapBrandForResponseAsync(brand);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapped
    });
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    // Check if any products exist under this brand
    const productCount = await Product.countDocuments({ brand: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: `Cannot delete brand. ${productCount} product(s) exist under this brand. Please disable the brand instead.` },
        data: null
      });
    }

    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({
      statusCode: 404,
      success: false,
      error: { message: 'Brand not found' },
      data: null
    });
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { message: 'Brand deleted successfully' }
    });
  } catch (e) { next(e); }
};

export const disable = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );
    if (!brand) return res.status(404).json({
      statusCode: 404,
      success: false,
      error: { message: 'Brand not found' },
      data: null
    });
    const mapped = await mapBrandForResponseAsync(brand);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapped
    });
  } catch (e) { next(e); }
};

export const enable = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true, runValidators: true }
    );
    if (!brand) return res.status(404).json({
      statusCode: 404,
      success: false,
      error: { message: 'Brand not found' },
      data: null
    });
    const mapped = await mapBrandForResponseAsync(brand);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: mapped
    });
  } catch (e) { next(e); }
};

export const validators = { createSchema, updateSchema };
