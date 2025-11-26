import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../constants/roles.js';

const addressSchema = new mongoose.Schema({
  name: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  country: String,
  pincode: String,
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, index: true },
  passwordHash: { type: String }, // only if you add password-based login later
  role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
  isActive: { type: Boolean, default: true },
  phone: { type: String, trim: true },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  addresses: [addressSchema]
}, { timestamps: true });

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};
userSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash || '');
};

export default mongoose.model('User', userSchema);

