import { z } from 'zod';
import * as orderService from '../services/order.service.js';

const createSchema = z.object({
  body: z.object({
    items: z.array(z.object({ product: z.string(), qty: z.number().int().positive() })),
    shippingAddress: z.object({
      name: z.string(), phone: z.string(),
      line1: z.string(), line2: z.string().optional(),
      city: z.string(), state: z.string(), country: z.string(), pincode: z.string()
    })
  })
});

export const create = async (req, res, next) => {
  try {
    const order = await orderService.create({ userId: req.user.id, ...req.body });
    res.status(201).json(order);
  } catch (e) { next(e); }
};

export const mine = async (req, res, next) => {
  try { res.json(await orderService.myOrders(req.user.id)); } catch (e) { next(e); }
};

export const validators = { createSchema };
