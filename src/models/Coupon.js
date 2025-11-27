import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 1
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableBrands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    min: 0
  },
  perUserLimit: {
    type: Number,
    min: 0
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Validate percentage value
couponSchema.pre('save', function(next) {
  if (this.type === 'percentage' && (this.value < 1 || this.value > 100)) {
    return next(new Error('Percentage value must be between 1 and 100'));
  }
  if (this.type === 'flat' && this.value < 1) {
    return next(new Error('Flat discount value must be at least 1'));
  }
  
  // Ensure code is uppercase
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }
  
  next();
});

// Check if coupon is expired
couponSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Check if coupon has started
couponSchema.methods.hasStarted = function() {
  if (!this.startDate) return true;
  return new Date() >= this.startDate;
};

// Check if usage limit exceeded
couponSchema.methods.isUsageLimitExceeded = function() {
  if (!this.usageLimit) return false;
  return this.usedCount >= this.usageLimit;
};

// Check if coupon is valid
couponSchema.methods.isValid = function() {
  return this.active && !this.isExpired() && this.hasStarted() && !this.isUsageLimitExceeded();
};

export default mongoose.model('Coupon', couponSchema);
