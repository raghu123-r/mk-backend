import mongoose from 'mongoose';

const orderItem = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: String,
  price: Number,
  qty: Number,
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItem],
  subtotal: Number,
  shipping: Number,
  tax: Number,
  total: Number,

  // ----- CORRECT: root-level order status with full enum -----
  status: {
    type: String,
    enum: [
      'pending',
      'accepted',
      'processing',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'rejected',
      'replace'
    ],
    default: 'pending'
  },

  shippingAddress: {
    name: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },

  payment: {
    method: { type: String, default: 'COD' }, // phase 2: gateway
    txnId: String,
    // keep payment.status separate and simple
    status: { type: String, default: 'init' }
  }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
