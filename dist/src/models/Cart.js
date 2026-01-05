import mongoose from 'mongoose';

/**
 * Cart Model
 * 
 * Represents a user's shopping cart with products and calculated totals.
 * Each cart is associated with a single user and contains an array of cart items.
 * The total is automatically recalculated before each save operation.
 * 
 * Cart items store a snapshot of product details (price, title, image) at the time
 * of adding to ensure price consistency even if product prices change later.
 */

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Optional: variant ID for products with variants
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    default: null
  },
  qty: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  // Price snapshot at time of adding to cart (prevents price changes from affecting cart)
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  // Product details snapshot for quick display without populating
  title: {
    type: String,
    required: true
  },
  // Optional: variant name for display (e.g., "26cm (3.5L)")
  variantName: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: ''
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Each user has only one cart
    index: true
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0,
    min: [0, 'Total cannot be negative']
  }
}, {
  timestamps: true
});

/**
 * Pre-save hook to automatically recalculate cart total
 * Sums up (price × qty) for all items in the cart
 */
cartSchema.pre('save', function(next) {
  // Calculate total from all cart items
  this.total = this.items.reduce((sum, item) => {
    return sum + (item.price * item.qty);
  }, 0);
  
  // Round to 2 decimal places to avoid floating point precision issues
  this.total = Math.round(this.total * 100) / 100;
  
  next();
});

/**
 * Instance method to find a cart item by product ID and optional variant ID
 * Maintains backward compatibility: items without variantId match when variantId is null
 */
cartSchema.methods.findItemByProductId = function(productId, variantId = null) {
  return this.items.find(item => {
    const productMatch = item.productId.toString() === productId.toString();
    const variantMatch = variantId 
      ? (item.variantId && item.variantId.toString() === variantId.toString())
      : !item.variantId; // If no variantId provided, match items without variant
    return productMatch && variantMatch;
  });
};

/**
 * Instance method to remove a cart item by product ID and optional variant ID
 */
cartSchema.methods.removeItemByProductId = function(productId, variantId = null) {
  this.items = this.items.filter(item => {
    const productMatch = item.productId.toString() === productId.toString();
    const variantMatch = variantId 
      ? (item.variantId && item.variantId.toString() === variantId.toString())
      : !item.variantId;
    return !(productMatch && variantMatch); // Keep items that don't match
  });
};

export default mongoose.model('Cart', cartSchema);
