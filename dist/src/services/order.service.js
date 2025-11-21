import Order from '../models/Order.js';
import Product from '../models/Product.js';
import createError from 'http-errors';

/**
 * Create a new order with product snapshots and computed totals
 * @param {Object} params - Order creation parameters
 * @param {string} params.userId - User ID placing the order
 * @param {Array} params.items - Array of { productId, quantity }
 * @param {Object} params.address - Shipping address
 * @param {string} params.paymentMethod - Payment method (default: 'COD')
 */
export const createOrder = async ({ userId, items, address, paymentMethod = 'COD' }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, 'No items provided');
  }

  // Fetch product data from database
  const productIds = items.map(i => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  
  if (products.length !== productIds.length) {
    throw createError(400, 'One or more products not found or inactive');
  }

  // Create a map for quick product lookup
  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  
  // Compute subtotals and create order items with product snapshots
  let totalPrice = 0;
  const orderItems = items.map(item => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw createError(400, `Product ${item.productId} not found`);
    }
    
    // Validate stock availability
    if (product.stock < item.quantity) {
      throw createError(400, `Insufficient stock for ${product.title}. Available: ${product.stock}`);
    }
    
    // Compute subtotal (server-side only)
    const subtotal = product.price * item.quantity;
    totalPrice += subtotal;
    
    // Return order item with product snapshot
    return {
      product: product._id,
      title: product.title,
      price: product.price, // Snapshot of price at order time
      qty: item.quantity,
      image: product.images?.[0] || ''
    };
  });

  // Calculate shipping and tax
  const shipping = totalPrice > 999 ? 0 : 49;
  const tax = Math.round(totalPrice * 0.18); // 18% GST
  const total = totalPrice + shipping + tax;

  // Create the order
  const order = await Order.create({
    user: userId,
    items: orderItems,
    subtotal: totalPrice,
    shipping,
    tax,
    total,
    shippingAddress: {
      name: address.name || '',
      phone: address.phone || '',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state || '',
      country: address.country || 'India',
      pincode: address.pincode
    },
    payment: {
      method: paymentMethod,
      status: 'init'
    },
    status: 'pending'
  });

  return order;
};

// Backward compatibility
export const create = async ({ userId, items, shippingAddress }) => {
  // Convert old format to new format
  const mappedItems = items.map(i => ({
    productId: i.product,
    quantity: i.qty
  }));
  
  return createOrder({
    userId,
    items: mappedItems,
    address: shippingAddress,
    paymentMethod: 'COD'
  });
};

export const myOrders = async (userId) => Order.find({ user: userId }).sort({ createdAt: -1 });
