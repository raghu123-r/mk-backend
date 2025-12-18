import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import createError from 'http-errors';
import mongoose from 'mongoose';

// CREATE PRODUCT
export const create = async (payload) => {
  if (payload.brand) {
    const b = await Brand.findById(payload.brand);
    if (!b) throw createError(400, 'Invalid brand');
  }

  if (payload.category) {
    const c = await Category.findById(payload.category);
    if (!c) throw createError(400, 'Invalid category');
  }

  return Product.create(payload);
};

// LIST PRODUCTS — FIXED DEFAULT LIMIT = 50
export const list = async ({ q, brand, category, page = 1, limit = 50 } = {}) => {
  const filter = { isActive: true };

  if (q) filter.title = { $regex: q, $options: 'i' };
  
  // Handle brand filtering - accept ObjectId string or ObjectId
  if (brand) {
    if (mongoose.Types.ObjectId.isValid(brand)) {
      filter.brand = brand;
    }
  }

  if (category) {
    let categoryId = null;

    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryId = category;
    } else {
      const found = await Category.findOne({
        $or: [{ name: category }, { slug: category }]
      });
      if (found) categoryId = found._id;
    }

    filter.category = categoryId || { $exists: false };
  }

  const skip = (page - 1) * limit;

  // Fetch products with populated brand and category
  const items = await Product.find(filter)
    .populate('brand category')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter out products where brand is disabled (business rule: disabled brands should not appear)
  // Categories can be disabled but products remain valid
  const filteredItems = items.filter(item => {
    // If brand is populated and has isActive field, check if it's active
    if (item.brand && typeof item.brand === 'object' && 'isActive' in item.brand) {
      return item.brand.isActive !== false;
    }
    return true; // If brand not populated or no isActive field, keep the product
  });

  const total = await Product.countDocuments(filter);

  return {
    items: filteredItems,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

// GET PRODUCT BY SLUG
export const getBySlug = async (slug) => {
  const product = await Product.findOne({ slug, isActive: true })
    .populate('brand category');

  if (!product) throw createError(404, 'Product not found');

  // Check if brand is disabled (business rule: disabled brands should not appear)
  if (product.brand && typeof product.brand === 'object' && 'isActive' in product.brand) {
    if (product.brand.isActive === false) {
      throw createError(404, 'Product not found');
    }
  }

  return product;
};

// UPDATE PRODUCT BY ID
export const updateProductById = async (id, updateData) => {
  const updated = await Product.findByIdAndUpdate(id, updateData, { new: true }).lean();
  return updated;
};

// DELETE PRODUCT BY ID
export const deleteProductById = async (id) => {
  const removed = await Product.findByIdAndDelete(id).lean();
  return removed;
};

// GET SIMILAR PRODUCTS
// Fetches similar products based on category first, then brand as fallback
// Excludes the current product from results
export const getSimilarProducts = async (productId, limit = 4) => {
  // Get the current product
  const currentProduct = await Product.findById(productId).select('category brand');
  if (!currentProduct) {
    throw createError(404, 'Product not found');
  }

  const results = [];

  // 1. Try to fetch by SAME CATEGORY first
  if (currentProduct.category) {
    const categoryProducts = await Product.find({
      category: currentProduct.category,
      _id: { $ne: productId }, // Exclude current product
      isActive: true
    })
      .populate('brand category')
      .limit(limit)
      .lean();

    // Filter out products with disabled brands
    const validCategoryProducts = categoryProducts.filter(item => {
      if (item.brand && typeof item.brand === 'object' && 'isActive' in item.brand) {
        return item.brand.isActive !== false;
      }
      return true;
    });

    results.push(...validCategoryProducts);
  }

  // 2. If we still need more products, fetch by SAME BRAND as fallback
  if (results.length < limit && currentProduct.brand) {
    const remaining = limit - results.length;
    const brandProducts = await Product.find({
      brand: currentProduct.brand,
      _id: { $ne: productId }, // Exclude current product
      isActive: true
    })
      .populate('brand category')
      .limit(remaining)
      .lean();

    // Filter out products with disabled brands and avoid duplicates
    const resultIds = new Set(results.map(p => p._id.toString()));
    const validBrandProducts = brandProducts.filter(item => {
      const itemId = item._id.toString();
      if (resultIds.has(itemId)) return false;
      
      if (item.brand && typeof item.brand === 'object' && 'isActive' in item.brand) {
        return item.brand.isActive !== false;
      }
      return true;
    });

    results.push(...validBrandProducts);
  }

  // Return limited results
  return results.slice(0, limit);
};
