/**
 * HeroImage Model
 * Represents hero banner images for the homepage carousel
 */
import mongoose from 'mongoose';

const heroImageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: ''
    },
    subtitle: {
      type: String,
      trim: true,
      default: ''
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true
    },
    imagePath: {
      type: String,
      required: true,
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    collection: 'hero_images'
  }
);

// Index for efficient queries
heroImageSchema.index({ isActive: 1, displayOrder: 1 });

const HeroImage = mongoose.model('HeroImage', heroImageSchema);

export default HeroImage;
