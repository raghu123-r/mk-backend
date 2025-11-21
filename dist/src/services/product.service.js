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
  if (brand) filter.brand = brand;

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

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('brand category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Product.countDocuments(filter),
  ]);

  return {
    items,
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

  return product;
};
