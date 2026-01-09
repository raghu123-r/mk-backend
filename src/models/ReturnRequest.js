import mongoose from 'mongoose';

/**
 * ReturnRequest Model
 * Handles product returns, replacements, and refunds without modifying Order model
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
  actionType: {
    type: String,
    enum: ['return', 'replace', 'refund'],
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },

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
