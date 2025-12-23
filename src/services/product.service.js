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
  const matchStage = { isActive: true };

  if (q) matchStage.title = { $regex: q, $options: 'i' };
  
  // Handle brand filtering - accept ObjectId string or ObjectId
  if (brand) {
    if (mongoose.Types.ObjectId.isValid(brand)) {
      matchStage.brand = new mongoose.Types.ObjectId(brand);
    }
  }

  if (category) {
    let categoryId = null;

    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryId = new mongoose.Types.ObjectId(category);
    } else {
      const found = await Category.findOne({
        $or: [{ name: category }, { slug: category }]
      });
      if (found) categoryId = found._id;
    }

    matchStage.category = categoryId || { $exists: false };
  }

  const skip = (page - 1) * limit;

  // Use aggregation to filter by brand.isActive at query time
  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brandData'
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryData'
      }
    },
    {
      $addFields: {
        brand: { $arrayElemAt: ['$brandData', 0] },
        category: { $arrayElemAt: ['$categoryData', 0] }
      }
    },
    {
      $match: {
        $or: [
          { brand: { $exists: false } },
          { 'brand.isActive': { $ne: false } }
        ]
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    }
  ];

  const result = await Product.aggregate(pipeline);
  
  const items = result[0]?.items || [];
  const total = result[0]?.totalCount[0]?.count || 0;
  const pages = Math.ceil(total / limit);

  return {
    items,
    total,
    page,
    pages,
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
    const categoryPipeline = [
      {
        $match: {
          category: currentProduct.category,
          _id: { $ne: new mongoose.Types.ObjectId(productId) },
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandData'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          brand: { $arrayElemAt: ['$brandData', 0] },
          category: { $arrayElemAt: ['$categoryData', 0] }
        }
      },
      {
        $match: {
          $or: [
            { brand: { $exists: false } },
            { 'brand.isActive': { $ne: false } }
          ]
        }
      },
      { $limit: limit }
    ];

    const categoryProducts = await Product.aggregate(categoryPipeline);
    results.push(...categoryProducts);
  }

  // 2. If we still need more products, fetch by SAME BRAND as fallback
  if (results.length < limit && currentProduct.brand) {
    const remaining = limit - results.length;
    const brandPipeline = [
      {
        $match: {
          brand: currentProduct.brand,
          _id: { $ne: new mongoose.Types.ObjectId(productId) },
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brandData'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $addFields: {
          brand: { $arrayElemAt: ['$brandData', 0] },
          category: { $arrayElemAt: ['$categoryData', 0] }
        }
      },
      {
        $match: {
          $or: [
            { brand: { $exists: false } },
            { 'brand.isActive': { $ne: false } }
          ]
        }
      },
      { $limit: remaining }
    ];

    const brandProducts = await Product.aggregate(brandPipeline);
    
    // Avoid duplicates
    const resultIds = new Set(results.map(p => p._id.toString()));
    const uniqueBrandProducts = brandProducts.filter(item => {
      return !resultIds.has(item._id.toString());
    });

    results.push(...uniqueBrandProducts);
  }

  // Return limited results
  return results.slice(0, limit);
};
