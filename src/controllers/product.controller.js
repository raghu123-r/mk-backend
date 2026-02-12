import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import * as productService from '../services/product.service.js';

/* =======================
   VALIDATION SCHEMAS
======================= */

const createSchema = z.object({
  body: z.object({
    title: z.string(),
    slug: z.string(),
    brand: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.string()).default([]),
    price: z.number(),
    mrp: z.number().optional(),
    stock: z.number().default(0),
    hasSizes: z.boolean().optional().default(false),
    variants: z.array(z.object({
      name: z.string(),
      sku: z.string().optional(),
      price: z.number(),
      mrp: z.number(),
      stock: z.number().default(0),
      isDefault: z.boolean().optional().default(false),
      attributes: z.record(z.string()).optional(),
      images: z.array(z.string()).optional(),
      isActive: z.boolean().optional().default(true)
    })).optional(),
    attributes: z.record(z.string()).optional()
  })
});

/**
 * ✅ UPDATED: added `subcategory`
 */
const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(), // ✅ FIX
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50)
  })
});

/* =======================
   CREATE PRODUCT
======================= */

export const create = async (req, res, next) => {
  try {
    const product = await productService.create(req.body);
    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: product
    });
  } catch (e) {
    next(e);
  }
};

/* =======================
   LIST PRODUCTS (FIXED)
======================= */

export const list = async (req, res, next) => {
  try {
    console.log('Product list controller - req.query:', req.query);
    const parsed = listSchema.parse({ query: req.query });

    const query = {
      q: parsed.query.q,
      brand: parsed.query.brand,
      category: parsed.query.category,
      subcategory: parsed.query.subcategory, // ✅ PASS IT
      page: parsed.query.page,
      limit: Number(parsed.query.limit)
    };

    console.log('Parsed query:', query);
    const data = await productService.list(query);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data
    });
  } catch (err) {
    console.error('Error in product list controller:', err);
    next(err);
  }
};

/* =======================
   GET PRODUCT BY SLUG
======================= */

export const getBySlugController = async (req, res) => {
  try {
    const product = await productService.getBySlug(req.params.slug);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: product
    });
  } catch (e) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      error: { message: 'Product not found' },
      data: null
    });
  }
};

/* =======================
   UPDATE PRODUCT
======================= */

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid product id' },
        data: null
      });
    }

    const allowed = [
      'title','slug','description','brand','category','images',
      'price','mrp','stock','attributes','isActive','meta',
      'tags','hasSizes','variants'
    ];

    const updateData = {};
    for (const key of allowed) {
      if (key in req.body) updateData[key] = req.body[key];
    }

    const updated = await productService.updateProductById(id, updateData);

    if (!updated) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Product not found' },
        data: null
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: updated
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.slug) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        error: { message: 'Slug already exists' },
        data: null
      });
    }

    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: err.message || 'Server error' },
      data: null
    });
  }
};

/* =======================
   DELETE PRODUCT
======================= */

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid product id' },
        data: null
      });
    }

    const removed = await productService.deleteProductById(id);

    if (!removed) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Product not found' },
        data: null
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { _id: id }
    });
  } catch (err) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Server error' },
      data: null
    });
  }
};

/* =======================
   SIMILAR PRODUCTS
======================= */

export const getSimilarProducts = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid product id' },
        data: null
      });
    }

    const limit = parseInt(req.query.limit) || 4;
    const data = await productService.getSimilarProducts(id, limit);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data
    });
  } catch (err) {
    next(err);
  }
};

export const validators = { createSchema, listSchema };
