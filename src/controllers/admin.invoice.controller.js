// ADMIN: invoices
import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';

// helper: return a valid ObjectId or undefined
const resolveCreatorId = (req) => {
  const maybe = req?.user?._id || req?.admin?._id;
  return (maybe && mongoose.Types.ObjectId.isValid(maybe)) ? maybe : undefined;
};

/**
 * POST /api/admin/invoices/quick
 * Create a quick invoice with minimal required fields
 */
export const createQuickInvoice = async (req, res) => {
  try {
    const { customer, items, total, subtotal, shipping, tax, notes } = req.body;

    // Validate required fields
    if (!customer || !customer.name) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Customer name is required' },
        data: null
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'At least one item is required' },
        data: null
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        error: { message: 'Total amount is required and must be greater than 0' },
        data: null
      });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.title || !item.price || !item.qty) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: 'Each item must have title, price, and qty' },
          data: null
        });
      }
    }

    // Create invoice
    const invoice = new Invoice({
      customer,
      items,
      total,
      subtotal: subtotal || total,
      shipping: shipping || 0,
      tax: tax || 0,
      notes,
      createdBy: resolveCreatorId(req),
      status: 'issued'
    });

    await invoice.save();

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: invoice
    });
  } catch (error) {
    console.error('Error creating quick invoice:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to create invoice' },
      data: null
    });
  }
};

/**
 * POST /api/admin/invoices
 * Create a full invoice (from order or custom payload)
 */
export const createInvoice = async (req, res) => {
  try {
    const { orderId, customer, items, total, subtotal, shipping, tax, notes } = req.body;

    // If orderId provided, populate invoice from order
    if (orderId) {
      // Validate orderId
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          error: { message: 'Invalid order ID' },
          data: null
        });
      }

      // Fetch order
      const order = await Order.findById(orderId).populate('user');
      if (!order) {
        return res.status(404).json({
          statusCode: 404,
          success: false,
          error: { message: 'Order not found' },
          data: null
        });
      }

      // Build invoice from order data
      const invoiceData = {
        orderRef: order._id,
        items: order.items || [],
        subtotal: order.subtotal || 0,
        shipping: order.shipping || 0,
        tax: order.tax || 0,
        total: order.total || 0,
        customer: {
          name: order.shippingAddress?.name || order.user?.name || 'Unknown',
          phone: order.shippingAddress?.phone || order.user?.phone || '',
          email: order.user?.email || '',
          address: order.shippingAddress ? {
            line1: order.shippingAddress.line1,
            line2: order.shippingAddress.line2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            country: order.shippingAddress.country,
            pincode: order.shippingAddress.pincode
          } : undefined
        },
        createdBy: resolveCreatorId(req),
        status: 'issued',
        notes: notes || `Invoice generated from Order ${order._id}`
      };

      const invoice = new Invoice(invoiceData);
      await invoice.save();

      return res.status(201).json({
        success: true,
        data: invoice
      });
    }

    // Otherwise, create invoice from provided payload
    // Validate required fields
    if (!customer || !customer.name) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Total amount is required and must be greater than 0'
      });
    }

    const invoice = new Invoice({
      customer,
      items,
      total,
      subtotal: subtotal || total,
      shipping: shipping || 0,
      tax: tax || 0,
      notes,
      createdBy: resolveCreatorId(req),
      status: 'issued'
    });

    await invoice.save();

    return res.status(201).json({
      statusCode: 201,
      success: true,
      error: null,
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: { message: 'Failed to create invoice' },
      data: null
    });
  }
};

/**
 * GET /api/admin/invoices/:id
 * Fetch invoice by ID
 */
export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invoice ID'
      });
    }

    // Fetch invoice
    const invoice = await Invoice.findById(id)
      .populate('orderRef')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
};
