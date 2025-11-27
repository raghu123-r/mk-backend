/**
 * User Dashboard Controller
 * 
 * Handles dashboard overview and orders listing for authenticated users
 * 
 * Sample curl commands:
 * 
 * GET dashboard:
 *   curl -H "Authorization: Bearer <TOKEN>" \
 *        "http://localhost:5001/user/dashboard?page=1&limit=5"
 * 
 * GET orders (paginated):
 *   curl -H "Authorization: Bearer <TOKEN>" \
 *        "http://localhost:5001/user/orders?page=1&limit=10"
 * 
 * GET orders (with sorting):
 *   curl -H "Authorization: Bearer <TOKEN>" \
 *        "http://localhost:5001/user/orders?page=1&limit=10&sort=-createdAt"
 */

import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { successResponse, errorResponse, paginationMeta } from '../utils/response.js';

/**
 * GET /user/dashboard
 * Returns comprehensive dashboard data including profile, stats, recent orders, and cart
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // Parse pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;
    
    // Fetch user profile (safe fields only)
    const user = await User.findById(userId)
      .select('_id name email phone createdAt')
      .lean();
    
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', null, 404)
      );
    }
    
    // Fetch order statistics
    const allOrders = await Order.find({ user: userId }).lean();
    const totalOrders = allOrders.length;
    const totalSpent = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Count orders by status
    const byStatus = allOrders.reduce((acc, order) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const stats = {
      totalOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      byStatus
    };
    
    // Fetch recent orders with pagination
    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name price images slug')
      .lean();
    
    // Format recent orders to include orderId and userId
    const formattedRecentOrders = recentOrders.map(order => ({
      orderId: order._id,
      userId: order.user,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping || 0,
      tax: order.tax || 0,
      items: order.items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
    
    // Fetch cart summary
    let cartSummary = null;
    const cart = await Cart.findOne({ userId })
      .populate('items.productId', 'name price')
      .lean();
    
    if (cart) {
      cartSummary = {
        itemCount: cart.items.length,
        subtotal: cart.total || 0,
        items: cart.items.map(item => ({
          productId: item.productId?._id,
          productName: item.productId?.name || item.title,
          price: item.price,
          qty: item.qty,
          itemTotal: item.price * item.qty
        }))
      };
    }
    
    // Generate recent activity from orders
    const recentActivity = recentOrders.slice(0, 5).map(order => ({
      type: 'order',
      orderId: order._id,
      status: order.status,
      amount: order.total,
      date: order.createdAt
    }));
    
    // Build pagination metadata
    const pagination = paginationMeta(page, limit, totalOrders);
    
    // Assemble dashboard response
    const dashboardData = {
      profile: {
        _id: user._id,
        name: user.name || '',
        email: user.email,
        phone: user.phone || '',
        createdAt: user.createdAt
      },
      stats,
      recentOrders: formattedRecentOrders,
      cart: cartSummary,
      recentActivity,
      pagination
    };
    
    return res.status(200).json(successResponse(dashboardData, null, 200));
    
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    return res.status(500).json(
      errorResponse('Server error', null, 500)
    );
  }
};

/**
 * GET /user/orders
 * Returns paginated list of user's orders with populated product details
 */
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // Parse pagination and sorting params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt'; // Default: newest first
    
    // Count total orders
    const total = await Order.countDocuments({ user: userId });
    
    // Fetch orders with pagination
    const orders = await Order.find({ user: userId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('items.product', 'name price images slug')
      .lean();
    
    // Format orders to include userId
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      userId: order.user,
      status: order.status,
      totalAmount: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping || 0,
      tax: order.tax || 0,
      items: order.items.map(item => ({
        product: item.product ? {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images,
          slug: item.product.slug
        } : null,
        title: item.title,
        price: item.price,
        qty: item.qty,
        image: item.image
      })),
      shippingAddress: order.shippingAddress,
      payment: order.payment,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
    
    // Build pagination metadata
    const pagination = paginationMeta(page, limit, total);
    
    return res.status(200).json(
      successResponse({
        orders: formattedOrders,
        pagination
      }, null, 200)
    );
    
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json(
      errorResponse('Server error', null, 500)
    );
  }
};
