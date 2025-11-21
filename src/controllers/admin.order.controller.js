// PATCH: explicit HTTP status codes for admin orders
// CONVERTED TO ESM
/**
 * Admin Order Controller
 * Handles admin-only operations for orders and billing
 */

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import fs from 'fs';
import path from 'path';

/**
 * List orders with pagination, search, filters
 * GET /api/admin/orders
 * Query params: page, limit, search, status, startDate, endDate
 */
export const listOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Search by billNumber or customer fields
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Execute query with pagination
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);

    return res.status(200).json({
      ok: true,
      data: orders,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('listOrders error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch orders'
    });
  }
};

/**
 * Get order details by ID
 * GET /api/admin/orders/:id
 */
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    return res.status(200).json({
      ok: true,
      data: order
    });
  } catch (error) {
    console.error('getOrder error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to fetch order'
    });
  }
};

/**
 * Update order status
 * PUT /api/admin/orders/:id/status
 * Body: { status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled' }
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid order ID'
      });
    }

    if (!status) {
      return res.status(400).json({
        ok: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).lean();

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    return res.status(200).json({
      ok: true,
      data: order
    });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to update order status'
    });
  }
};

/**
 * Assign vendor and driver to order
 * PUT /api/admin/orders/:id/assign
 * Body: { vendorId?, driverId? }
 */
export const assignVendorDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId, driverId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid order ID'
      });
    }

    if (!vendorId && !driverId) {
      return res.status(400).json({
        ok: false,
        error: 'At least one of vendorId or driverId is required'
      });
    }

    const updateFields = { updatedAt: new Date() };

    if (vendorId) {
      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid vendor ID'
        });
      }
      updateFields.vendorId = vendorId;
    }

    if (driverId) {
      if (!mongoose.Types.ObjectId.isValid(driverId)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid driver ID'
        });
      }
      updateFields.driverId = driverId;
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).lean();

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    return res.status(200).json({
      ok: true,
      data: order
    });
  } catch (error) {
    console.error('assignVendorDriver error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to assign vendor/driver'
    });
  }
};

/**
 * Upload attachment to order
 * POST /api/admin/orders/:id/upload
 * Multipart: attachment (file)
 */
export const uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid order ID'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: 'No file uploaded'
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    // Store attachment info
    const attachmentData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    };

    // Initialize attachments array if it doesn't exist
    if (!order.attachments) {
      order.attachments = [];
    }

    order.attachments.push(attachmentData);
    order.updatedAt = new Date();

    await order.save();

    return res.status(200).json({
      ok: true,
      data: {
        orderId: order._id,
        attachment: attachmentData
      }
    });
  } catch (error) {
    console.error('uploadAttachment error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to upload attachment'
    });
  }
};

/**
 * Get invoice JSON payload for an order
 * GET /api/admin/orders/:id/invoice
 */
export const getInvoicePayload = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id)
      .populate('items.product', 'name price')
      .lean();

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    // Build invoice payload
    const invoicePayload = {
      invoiceNumber: order.billNumber || order._id,
      invoiceDate: order.createdAt,
      dueDate: order.dueDate || null,
      status: order.status,
      customer: {
        name: order.customer?.name || 'N/A',
        email: order.customer?.email || '',
        phone: order.customer?.phone || '',
        address: order.shippingAddress || order.billingAddress || {}
      },
      items: (order.items || []).map(item => ({
        productId: item.product?._id || item.productId,
        productName: item.product?.name || item.name || 'Unknown',
        quantity: item.quantity || 0,
        unitPrice: item.price || 0,
        total: (item.quantity || 0) * (item.price || 0)
      })),
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shippingCost || 0,
      discount: order.discount || 0,
      total: order.total || 0,
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentStatus || 'pending',
      notes: order.notes || ''
    };

    return res.status(200).json({
      ok: true,
      data: invoicePayload
    });
  } catch (error) {
    console.error('getInvoicePayload error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to generate invoice'
    });
  }
};

/**
 * Convert quote to order
 * POST /api/admin/orders/:id/convert
 * NOTE: Only works if Quote model exists
 */
export const convertQuoteToOrder = async (req, res) => {
  try {
    // Check if Quote model exists
    let Quote;
    try {
      const quoteModule = await import('../models/Quote.js');
      Quote = quoteModule.default;
    } catch (err) {
      return res.status(501).json({
        ok: false,
        error: 'Quote to Order conversion not implemented. TODO: Create src/models/Quote.js'
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid quote ID'
      });
    }

    const quote = await Quote.findById(id);

    if (!quote) {
      return res.status(404).json({
        ok: false,
        error: 'Quote not found'
      });
    }

    if (quote.status === 'converted') {
      return res.status(400).json({
        ok: false,
        error: 'Quote already converted to order'
      });
    }

    // Create order from quote
    const orderData = {
      customer: quote.customer,
      items: quote.items,
      subtotal: quote.subtotal,
      tax: quote.tax,
      shipping: quote.shippingCost || 0,
      discount: quote.discount || 0,
      total: quote.total,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: quote.shippingAddress,
      billingAddress: quote.billingAddress,
      notes: `Converted from quote #${quote.quoteNumber || quote._id}`,
      quoteId: quote._id,
      createdBy: req.user._id
    };

    const order = await Order.create(orderData);

    // Update quote status
    quote.status = 'converted';
    quote.orderId = order._id;
    quote.convertedAt = new Date();
    quote.convertedBy = req.user._id;
    await quote.save();

    return res.status(201).json({
      ok: true,
      data: {
        order,
        quoteId: quote._id
      }
    });
  } catch (error) {
    console.error('convertQuoteToOrder error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to convert quote to order'
    });
  }
};
