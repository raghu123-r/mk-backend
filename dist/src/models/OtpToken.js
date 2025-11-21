import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, index: true },
  otpHash: String,
  purpose: { type: String, enum: ['login', 'signup', 'forgot'], required: true },
  expiresAt: Date,
  consumed: { type: Boolean, default: false }
}, { timestamps: true });

otpSchema.index({ email: 1, purpose: 1, consumed: 1 });

export default mongoose.model('OtpToken', otpSchema);

