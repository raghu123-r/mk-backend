import { z } from 'zod';
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

export const validators = { createSchema, listSchema };
