import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  description: String,
  images: [{ type: String }], // Supabase public URLs
  price: { type: Number, required: true },
  mrp: Number,
  stock: { type: Number, default: 0 },
  attributes: { type: Map, of: String }, // e.g., color, material
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model('Product', productSchema);

