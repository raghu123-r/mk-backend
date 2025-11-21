import User from '../models/User.js';
import Product from '../models/Product.js';
import createError from 'http-errors';

export const me = async (id) => User.findById(id).select('-passwordHash').populate('wishlist');

export const toggleWishlist = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product) throw createError(404, 'Product not found');
  const user = await User.findById(userId);
  const exists = user.wishlist.some(p => p.toString() === productId);
  if (exists) {
    user.wishlist = user.wishlist.filter(p => p.toString() !== productId);
  } else {
    user.wishlist.push(productId);
  }
  await user.save();
  return user.populate('wishlist');
};
