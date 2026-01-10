import mongoose from 'mongoose';

/**
 * ReturnRequest Model
 * Handles product returns with or without refunds
 * PRODUCTION RULE: Only two action types allowed - 'return' and 'return_refund'
 */
const returnRequestSchema = new mongoose.Schema({
  // Reference to user who requested the return
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Reference to the order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },

  // Reference to the specific product in the order
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  // Action type: what the user wants
  // ONLY two options: 'return' (return only) or 'return_refund' (return + refund)
  actionType: {
    type: String,
    enum: ['return', 'return_refund'],
    required: true
  },

  // Issue type: why they're requesting this
  issueType: {
    type: String,
    enum: [
      'damaged',
      'wrong-item',
      'quality-issue',
      'late-delivery',
      'others'
    ],
    required: true
  },

  // Issue description (required only when issueType is 'others')
  issueDescription: {
    type: String,
    default: null,
    trim: true
  },

  // Status of the return request
  // Full lifecycle statuses for return/refund tracking
  status: {
    type: String,
    enum: [
      'return_requested',    // Initial state when user submits request
      'return_approved',     // Admin approves the return
      'pickup_scheduled',    // Pickup has been scheduled
      'product_received',    // Product has been received back
      'refund_initiated',    // Refund process started (only for return_refund)
      'refund_completed',    // Refund completed (only for return_refund)
      'return_completed',    // Return process completed
      'return_rejected',     // Return request rejected
      // Legacy statuses for backward compatibility
      'pending',             // Maps to return_requested
      'approved',            // Maps to return_approved
      'rejected',            // Maps to return_rejected
      'completed'            // Maps to return_completed
    ],
    default: 'return_requested',
    index: true
  },

  // Status history tracking - records every status change
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    updatedBy: {
      type: String,
      enum: ['system', 'admin', 'user'],
      required: true
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: null
    }
  }],

  // Optional: Admin notes for internal tracking
  adminNotes: {
    type: String,
    default: null
  },

  // Optional: Refund amount if approved
  refundAmount: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate return requests for same order + product
returnRequestSchema.index({ orderId: 1, productId: 1 }, { unique: true });

// Virtual to get product details (populated when needed)
returnRequestSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// Virtual to get order details (populated when needed)
returnRequestSchema.virtual('order', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON output
returnRequestSchema.set('toJSON', { virtuals: true });
returnRequestSchema.set('toObject', { virtuals: true });

export default mongoose.model('ReturnRequest', returnRequestSchema);
