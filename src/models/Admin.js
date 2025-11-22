import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'admin' },
    isActive: { type: Boolean, default: true },
    wishlist: { type: Array, default: [] },
    addresses: { type: Array, default: [] }
  },
  { collection: 'users' }
);

// Hash password before save
AdminSchema.pre('save', async function (next) {
  try {
    // Only hash if password is provided (new password)
    if (this.isModified('passwordHash')) {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
AdminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
