import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import ProductVariant from '../models/ProductVariant.js';
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

  // Validation: If hasSizes is true, variants must be provided and at least one must be default
  if (payload.hasSizes) {
    if (!payload.variants || !Array.isArray(payload.variants) || payload.variants.length === 0) {
      throw createError(400, 'At least one size is required when hasSizes is enabled');
    }

    const defaultVariants = payload.variants.filter(v => v.isDefault === true);
    if (defaultVariants.length === 0) {
      throw createError(400, 'At least one size must be marked as default');
    }
    if (defaultVariants.length > 1) {
      throw createError(400, 'Only one size can be marked as default');
    }

    // Validate each variant
    for (const variant of payload.variants) {
      if (!variant.name || !variant.price || !variant.mrp) {
        throw createError(400, 'Each size must have name, price, and MRP');
      }
      if (variant.price > variant.mrp) {
        throw createError(400, `Price cannot be greater than MRP for size: ${variant.name}`);
      }
    }
  }

  // Extract variants from payload
  const { variants: variantsData, ...productData } = payload;

  // Create the product
  const product = await Product.create(productData);

  // If hasSizes is true, create variants
  if (payload.hasSizes && variantsData && variantsData.length > 0) {
    const variantsToCreate = variantsData.map(v => ({
      ...v,
      product: product._id
    }));
    await ProductVariant.insertMany(variantsToCreate);
  }

  return product;
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
      $lookup: {
        from: 'productvariants',
        localField: '_id',
        foreignField: 'product',
        as: 'variants'
      }
    },
    {
      $addFields: {
        brand: { $arrayElemAt: ['$brandData', 0] },
        category: { $arrayElemAt: ['$categoryData', 0] },
        // Find default variant
        defaultVariant: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$variants',
                as: 'variant',
                cond: { $eq: ['$$variant.isDefault', true] }
              }
            },
            0
          ]
        }
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

  // Fetch variants if they exist
  const variants = await ProductVariant.find({ 
    product: product._id, 
    isActive: true 
  }).sort({ createdAt: 1 });

  // Add variants to product object (only if variants exist)
  const productObj = product.toObject();
  if (variants.length > 0) {
    productObj.variants = variants;
    
    // Find default variant and use its price/stock if available
    const defaultVariant = variants.find(v => v.isDefault === true);
    if (defaultVariant) {
      productObj.defaultVariant = defaultVariant;
    }
  }

  return productObj;
};

// UPDATE PRODUCT BY ID
export const updateProductById = async (id, updateData) => {
  // Validation: If hasSizes is being set to true, variants must be provided
  if (updateData.hasSizes === true && updateData.variants) {
    if (!Array.isArray(updateData.variants) || updateData.variants.length === 0) {
      throw createError(400, 'At least one size is required when hasSizes is enabled');
    }

    const defaultVariants = updateData.variants.filter(v => v.isDefault === true);
    if (defaultVariants.length === 0) {
      throw createError(400, 'At least one size must be marked as default');
    }
    if (defaultVariants.length > 1) {
      throw createError(400, 'Only one size can be marked as default');
    }

    // Validate each variant
    for (const variant of updateData.variants) {
      if (!variant.name || variant.price == null || variant.mrp == null) {
        throw createError(400, 'Each size must have name, price, and MRP');
      }
      if (variant.price > variant.mrp) {
        throw createError(400, `Price cannot be greater than MRP for size: ${variant.name}`);
      }
    }
  }

  // Extract variants from updateData
  const { variants: variantsData, ...productUpdates } = updateData;

  // Update the product
  const updated = await Product.findByIdAndUpdate(id, productUpdates, { new: true }).lean();
  
  if (!updated) {
    return null;
  }

  // If variants are provided, update them
  if (variantsData) {
    // Get existing variants
    const existingVariants = await ProductVariant.find({ product: id });
    const existingVariantIds = new Set(existingVariants.map(v => v._id.toString()));

    // Separate new variants and updates
    const variantsToCreate = [];
    const variantsToUpdate = [];
    const providedVariantIds = new Set();

    for (const variant of variantsData) {
      if (variant._id && existingVariantIds.has(variant._id.toString())) {
        // Existing variant - update it
        variantsToUpdate.push(variant);
        providedVariantIds.add(variant._id.toString());
      } else {
        // New variant - create it
        variantsToCreate.push({ ...variant, product: id });
      }
    }

    // Delete variants that are not in the provided list
    const variantsToDelete = existingVariants
      .filter(v => !providedVariantIds.has(v._id.toString()))
      .map(v => v._id);

    // Execute updates
    await Promise.all([
      // Create new variants
      variantsToCreate.length > 0 ? ProductVariant.insertMany(variantsToCreate) : Promise.resolve(),
      // Update existing variants
      ...variantsToUpdate.map(v => 
        ProductVariant.findByIdAndUpdate(v._id, v, { new: true })
      ),
      // Delete removed variants
      variantsToDelete.length > 0 ? ProductVariant.deleteMany({ _id: { $in: variantsToDelete } }) : Promise.resolve()
    ]);
  }

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
