import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import * as productService from '../services/product.service.js';

// VALIDATION SCHEMAS
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
    attributes: z.record(z.string()).optional()
  })
});

const listSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50)   // FIXED → FRONTEND ALWAYS GETS ALL
  })
});

// CREATE PRODUCT
export const create = async (req, res, next) => {
  try {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
};

// LIST PRODUCTS
export const list = async (req, res, next) => {
  try {
    // Validate req.query using Zod
    const parsed = listSchema.parse({ query: req.query });

    // Build final query
    const query = {
      q: parsed.query.q,
      brand: parsed.query.brand,
      category: parsed.query.category,
      page: parsed.query.page,
      limit: parsed.query.limit ? Number(parsed.query.limit) : 50
    };

    const data = await productService.list(query);
    res.json(data);

  } catch (err) {
    next(err);
  }
};

// GET PRODUCT BY SLUG — Express wrapper
export const getBySlugController = async (req, res) => {
  
  try {
    const product = await productService.getBySlug(req.params.slug);
    res.json(product);
  } catch (e) {
    res.status(404).json({ message: "Product not found" });
  }
};

/**
 * PATCH /api/products/:id
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const allowed = ['title','slug','description','brand','category','images','price','mrp','stock','attributes','isActive','meta','tags'];
    const updateData = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) updateData[key] = req.body[key];
    }

    if ('images' in updateData && !Array.isArray(updateData.images)) {
      return res.status(400).json({ success:false, message: 'Images must be an array of URLs' });
    }

    // call service
    const updated = await productService.updateProductById(id, updateData);
    if (!updated) {
      return res.status(404).json({ success:false, message:'Product not found' });
    }

    return res.status(200).json({ success:true, data: updated, message:'Product updated' });
  } catch (err) {
    console.error('updateProduct error', err);
    // handle duplicate slug error (E11000)
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      return res.status(409).json({ success:false, message:'Slug already exists' });
    }
    return res.status(500).json({ success:false, message:'Server error' });
  }
};

/**
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success:false, message:'Invalid product id' });
    }

    const removed = await productService.deleteProductById(id);
    if (!removed) {
      return res.status(404).json({ success:false, message:'Product not found' });
    }

    return res.status(200).json({ success:true, data:{ _id: id }, message:'Product deleted' });
  } catch (err) {
    console.error('deleteProduct error', err);
    return res.status(500).json({ success:false, message:'Server error' });
  }
};

export const validators = { createSchema, listSchema };
