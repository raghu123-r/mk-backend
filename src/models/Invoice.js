// ADMIN: invoices
import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, default: 1 },
  image: String
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  // Optional reference to an Order (if invoice was created from an order)
  orderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  
  // Invoice items
  items: { type: [invoiceItemSchema], required: true },
  
  // Totals
  subtotal: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  
  // Customer information
  customer: {
    name: { type: String, required: true },
    phone: String,
    email: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    }
  },
  
  // Admin who created this invoice
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Invoice status
  status: { type: String, enum: ['draft', 'issued', 'paid', 'cancelled'], default: 'issued' },
  
  // Invoice metadata
  invoiceNumber: String,
  notes: String
}, { timestamps: true });

// Generate invoice number on creation
invoiceSchema.pre('save', function(next) {
  if (!this.invoiceNumber && this.isNew) {
    this.invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
