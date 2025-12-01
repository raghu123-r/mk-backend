import { z } from 'zod';
import * as orderService from '../services/order.service.js';
import Cart from '../models/Cart.js';

const createSchema = z.object({
  body: z.object({
    items: z.array(z.object({ 
      productId: z.string(), 
      quantity: z.number().int().positive() 
    })),
    address: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      country: z.string().optional(),
      pincode: z.string()
    }),
    paymentMethod: z.string().optional().default('COD'),
    couponCode: z.string().optional()
  })
});

/**
 * Create a new order from cart items
 * Expects: { items: [{ productId, quantity }], address, paymentMethod }
 */
export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder({ 
      userId: req.user.id, 
      items: req.body.items,
      address: req.body.address,
      paymentMethod: req.body.paymentMethod || 'COD',
      couponCode: req.body.couponCode
    });
    
    try {
      await Cart.findOneAndUpdate(
        { userId: req.user.id },
        { items: [], total: 0 }
      );
    } catch (e) {}
    
    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: { 
        order 
      }
    });
  } catch (e) { 
    next(e); 
  }
};

// Keep backward compatibility
export const create = createOrder;

export const mine = async (req, res, next) => {
  try {
    const data = await orderService.myOrders(req.user.id);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data
    });
  } catch (e) { next(e); }
};

export const validators = { createSchema };
