import Order from '../models/Order.js';
import Product from '../models/Product.js';
import createError from 'http-errors';

export const create = async ({ userId, items, shippingAddress }) => {
  if (!Array.isArray(items) || items.length === 0) throw createError(400, 'No items');

  // fetch product prices & validate stock (basic)
  const ids = items.map(i => i.product);
  const products = await Product.find({ _id: { $in: ids }, isActive: true });
  const map = new Map(products.map(p => [p._id.toString(), p]));
  let subtotal = 0;
  const finalItems = items.map(i => {
    const p = map.get(i.product);
    if (!p) throw createError(400, 'Invalid product');
    if (p.stock < i.qty) throw createError(400, `Insufficient stock for ${p.title}`);
    subtotal += p.price * i.qty;
    return { product: p._id, title: p.title, price: p.price, qty: i.qty, image: p.images?.[0] };
  });
  const shipping = subtotal > 999 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18); // example GST 18%
  const total = subtotal + shipping + tax;

  // (Phase 2: hold stock during payment)
  const order = await Order.create({ user: userId, items: finalItems, subtotal, shipping, tax, total, shippingAddress });
  return order;
};

export const myOrders = async (userId) => Order.find({ user: userId }).sort({ createdAt: -1 });
