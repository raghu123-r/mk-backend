import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

// VALIDATION SCHEMAS
const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().min(1, 'Comment is required').max(1000, 'Comment too long')
  })
});

/**
 * POST /api/reviews
 * Create a new review for a product
 */
export const createReview = async (req, res, next) => {
  try {
    // Validate request body
    const parsed = createReviewSchema.parse({ body: req.body });
    const { productId, name, rating, comment } = parsed.body;

    // Validate productId format
    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid product ID format' },
        data: null
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        error: { message: 'Product not found' },
        data: null
      });
    }

    // Create review
    const review = await Review.create({
      product: productId,
      name: name.trim(),
      rating,
      comment: comment.trim()
    });

    // Update product rating average and count
    await updateProductRating(productId);

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: review
    });
  } catch (err) {
    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
      const messages = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: messages },
        data: null
      });
    }
    next(err);
  }
};

/**
 * GET /api/products/:productId/reviews
 * Get all reviews for a specific product
 */
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Invalid product ID format' },
        data: null
      });
    }

    // Fetch reviews, sorted by newest first
    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper function to update product rating average and count
 */
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ product: productId });
    
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        'attributes.ratingAvg': 0,
        'attributes.ratingCount': 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      'attributes.ratingAvg': Math.round(avgRating * 10) / 10, // Round to 1 decimal
      'attributes.ratingCount': reviews.length
    });
  } catch (err) {
    console.error('Error updating product rating:', err);
  }
}

export const validators = {
  createReviewSchema
};
