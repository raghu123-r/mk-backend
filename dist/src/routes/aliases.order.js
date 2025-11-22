/**
 * Order Alias Routes
 * Provides additional order endpoints for frontend compatibility
 * ADAPTERS: added by automation — safe wrapper
 * Generated: 2025-11-10
 */

import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import Order from '../models/Order.js';

const router = Router();

/**
 * GET /orders/:id
 * Get single order by ID (with ownership check)
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id,
      user: req.user.id 
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: `No order with ID "${req.params.id}" for this user` 
      });
    }
    
    res.json(order);
  } catch (e) {
    next(e);
  }
});

export default router;
