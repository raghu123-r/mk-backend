import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { create, mine, validators } from '../controllers/order.controller.js';

const router = Router();
router.post('/', protect, validate(validators.createSchema), create);
router.get('/me', protect, mine);
export default router;
