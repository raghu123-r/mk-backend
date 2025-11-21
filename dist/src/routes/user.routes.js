import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { getMe, toggleWishlist, validators } from '../controllers/user.controller.js';

const router = Router();
router.get('/me', protect, getMe);
router.post('/wishlist/toggle', protect, validate(validators.wishlistSchema), toggleWishlist);
export default router;

