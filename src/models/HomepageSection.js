import mongoose from 'mongoose';

/**
 * HomepageSection Model
 * Place this file at: src/models/HomepageSection.js
 */
const homepageSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Section title is required'],
      trim: true,
    },

    sectionType: {
      type: String,
      enum: ['products', 'categories', 'brands'],
      required: [true, 'Section type is required'],
      default: 'products',
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Filter: which categories to pull products from
    categoryIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    ],

    // Filter: which brands to pull products from
    brandIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    ],

    // Discount filter
    discountType: {
      type: String,
      enum: ['percentage', 'flat', ''],
      default: '',
    },
    minDiscount: { type: Number, default: null },
    maxDiscount: { type: Number, default: null },

    // Manually pinned product IDs for this section
    productIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
  },
  { timestamps: true }
);

homepageSectionSchema.index({ displayOrder: 1 });

export default mongoose.model('HomepageSection', homepageSectionSchema);