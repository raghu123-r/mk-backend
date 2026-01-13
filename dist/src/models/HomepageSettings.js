import mongoose from 'mongoose';

/**
 * HomepageSettings Model
 * Stores admin-controlled homepage configuration
 * Singleton pattern - only one document exists
 */
const homepageSettingsSchema = new mongoose.Schema({
  // Array of product IDs for "Top Picks" section
  // Order matters - first item appears first
  // Max 8 products
  pinnedProductIds: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 8;
      },
      message: 'Maximum 8 pinned products allowed'
    }
  }
}, { timestamps: true });

// Static method to get or create singleton settings
homepageSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model('HomepageSettings', homepageSettingsSchema);
