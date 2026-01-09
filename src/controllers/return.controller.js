import { z } from 'zod';
import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import createError from 'http-errors';

/**
 * Validation schema for creating a return request
 */
const createReturnSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    productId: z.string().min(1, 'Product ID is required'),
    actionType: z.enum(['return', 'replace', 'refund'], {
      errorMap: () => ({ message: 'Action type must be return, replace, or refund' })
    }),
    issueType: z.enum(['damaged', 'wrong-item', 'quality-issue', 'late-delivery', 'others'], {
      errorMap: () => ({ message: 'Invalid issue type' })
    }),
    issueDescription: z.string().optional()
  }).refine(
    // If issueType is 'others', issueDescription is required
    (data) => {
      if (data.issueType === 'others') {
        return data.issueDescription && data.issueDescription.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Issue description is required when issue type is "others"',
      path: ['issueDescription']
    }
  )
});

/**
 * Create a new return request
 * POST /api/returns
 */
export const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, productId, actionType, issueType, issueDescription } = req.body;
    const userId = req.user.id;

    // Verify the order exists and belongs to the user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return next(createError(404, 'Order not found or does not belong to you'));
    }

    // Verify the product exists in the order
    const orderItem = order.items.find(item => item.product.toString() === productId);
    if (!orderItem) {
      return next(createError(400, 'Product not found in this order'));
    }

    // Check if a return request already exists for this order + product
    const existingReturn = await ReturnRequest.findOne({ orderId, productId });
    if (existingReturn) {
      return next(createError(409, 'A return request already exists for this product'));
    }

    // Create the return request
    const returnRequest = await ReturnRequest.create({
      userId,
      orderId,
      productId,
      actionType,
      issueType,
      issueDescription: issueType === 'others' ? issueDescription : null,
      status: 'pending'
    });

    // Populate product and order details
    await returnRequest.populate('productId', 'name price image');

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all return requests for the logged-in user
 * GET /api/returns/my
 * Supports pagination: ?page=1&limit=10
 */
export const getMyReturnRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await ReturnRequest.countDocuments({ userId });

    // Get paginated return requests
    const returnRequests = await ReturnRequest.find({ userId })
      .populate('productId', 'name price image')
      .populate('orderId', 'createdAt status total')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: {
        returnRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get return request status for a specific order
 * GET /api/returns/order/:orderId
 * Returns all return requests for products in this order
 */
export const getReturnRequestsByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Verify the order exists and belongs to the user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return next(createError(404, 'Order not found or does not belong to you'));
    }

    // Get all return requests for this order
    const returnRequests = await ReturnRequest.find({ orderId })
      .populate('productId', 'name price image')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: returnRequests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update return request status (Admin only - future use)
 * PUT /api/returns/:id/status
 */
export const updateReturnRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, refundAmount } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return next(createError(400, 'Invalid status'));
    }

    // Find and update the return request
    const returnRequest = await ReturnRequest.findByIdAndUpdate(
      id,
      { 
        status,
        ...(adminNotes && { adminNotes }),
        ...(refundAmount && { refundAmount })
      },
      { new: true }
    ).populate('productId', 'name price image');

    if (!returnRequest) {
      return next(createError(404, 'Return request not found'));
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: returnRequest
    });
  } catch (error) {
    next(error);
  }
};

// Export validators for use in routes
export const validators = {
  createReturnSchema
};
