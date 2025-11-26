import { z } from 'zod';
import Brand from '../models/Brand.js';

const createSchema = z.object({ body: z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().url().optional()
})});

const updateSchema = z.object({ body: z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  logoUrl: z.string().url().optional()
})});

export const create = async (req, res, next) => {
  try {
    const b = await Brand.create(req.body);
    res.status(201).json(b);
  } catch (e) { next(e); }
};

export const list = async (_req, res, next) => {
  try { res.json(await Brand.find().sort({ name: 1 })); } catch (e) { next(e); }
};

export const getById = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.json(brand);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.json(brand);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.json({ message: 'Brand deleted successfully' });
  } catch (e) { next(e); }
};

export const validators = { createSchema, updateSchema };
