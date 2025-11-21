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
 * Instance method to find a cart item by product ID
 */
cartSchema.methods.findItemByProductId = function(productId) {
  return this.items.find(item => 
    item.productId.toString() === productId.toString()
  );
};

/**
 * Instance method to remove a cart item by product ID
 */
cartSchema.methods.removeItemByProductId = function(productId) {
  this.items = this.items.filter(item => 
    item.productId.toString() !== productId.toString()
  );
};

export default mongoose.model('Cart', cartSchema);
