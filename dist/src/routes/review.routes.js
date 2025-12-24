import { Router } from 'express';
import { createReview, getProductReviews } from '../controllers/review.controller.js';

const router = Router();

// POST /api/reviews - Create a new review
router.post('/', createReview);

// GET /api/products/:productId/reviews - Get all reviews for a product
router.get('/products/:productId/reviews', getProductReviews);

export default router;
