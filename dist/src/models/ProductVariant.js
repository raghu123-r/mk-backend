import mongoose from 'mongoose';

/**
 * ProductVariant Model
 * 
 * Represents different variations of a product (e.g., size, capacity, material).
 * Each variant has its own price, MRP, stock, and optional attributes.
 * Variants are separate documents for flexibility and performance.
 */

const productVariantSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true // Index for efficient querying by product
  },
  name: {
    type: String,
    required: true,
    trim: true
    // Example: "26cm (3.5L)", "1.5L", "Small", "Red"
  },
  sku: {
    type: String,
    trim: true,
    sparse: true, // Allows null values, but enforces unique if present
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  mrp: {
    type: Number,
    required: true,
    min: [0, 'MRP cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  attributes: {
    type: Map,
    of: String,
    default: {}
    // Example: { size: "26cm", capacity: "3.5L", material: "Stainless Steel" }
  },
  images: {
    type: [String],
    default: []
    // Optional: variant-specific images; falls back to product images if empty
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Compound index for product + name uniqueness
productVariantSchema.index({ product: 1, name: 1 }, { unique: true });

// Validation: price should be <= mrp
productVariantSchema.pre('validate', function(next) {
  if (this.price > this.mrp) {
    this.invalidate('price', 'Price cannot be greater than MRP');
  }
  next();
});

export default mongoose.model('ProductVariant', productVariantSchema);
