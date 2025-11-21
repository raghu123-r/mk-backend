import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createOrder, create, mine, validators } from '../controllers/order.controller.js';

const router = Router();

// POST /api/orders - Create new order from cart
router.post('/', protect, validate(validators.createSchema), createOrder);

// GET /api/orders/me - Get user's orders
router.get('/me', protect, mine);

export default router;
