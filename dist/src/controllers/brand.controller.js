import { z } from 'zod';
import Brand from '../models/Brand.js';

const createSchema = z.object({ body: z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
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
export const validators = { createSchema };
