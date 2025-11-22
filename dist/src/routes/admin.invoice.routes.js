// ADMIN: invoices
/**
 * Admin Invoice Routes
 * Admin-only endpoints for invoice management
 */

import express from 'express';
const router = express.Router();
// Import auth middlewares with proper named exports
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

import * as adminInvoiceController from '../controllers/admin.invoice.controller.js';

// ======= DEV TESTING: optional auth bypass (REMOVE BEFORE PRODUCTION) =======
const devBypassAuth = (req, res, next) => {
  req.user = { _id: 'DEV_ADMIN', name: 'Dev Admin', role: 'admin' };
  req.admin = { _id: 'DEV_ADMIN', name: 'Dev Admin', role: 'admin' };
  next();
};

// Choose middleware based on env flag
let adminAuthMiddleware;
if (process.env.FEATURE_ADMIN_ORDERS_BYPASS === 'true') {
  adminAuthMiddleware = devBypassAuth;
} else {
  adminAuthMiddleware = [requireAuth, requireAdmin];
}

// ============================================
// FEATURE FLAG CHECK
// ============================================
router.use((req, res, next) => {
  if (process.env.FEATURE_ADMIN_INVOICES !== 'true') {
    return res.status(404).json({
      ok: false,
      error: 'Feature disabled'
    });
  }
  next();
});

// ============================================
// ROUTES - All protected by auth + admin
// ============================================

/**
 * POST /api/admin/invoices/quick
 * Create a quick invoice with minimal required fields
 */
router.post(
  '/quick',
  adminAuthMiddleware,
  adminInvoiceController.createQuickInvoice
);

/**
 * POST /api/admin/invoices
 * Create a full invoice (from order or custom payload)
 */
router.post(
  '/',
  adminAuthMiddleware,
  adminInvoiceController.createInvoice
);

/**
 * GET /api/admin/invoices/:id
 * Fetch invoice by ID
 */
router.get(
  '/:id',
  adminAuthMiddleware,
  adminInvoiceController.getInvoice
);

export default router;
