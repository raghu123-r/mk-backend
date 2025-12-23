// ADMIN: contact submissions
/**
 * Admin Contact Submissions Routes
 * Admin-only endpoints for viewing contact form submissions
 */

import express from 'express';
const router = express.Router();
// Import auth middlewares with proper named exports
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

import * as adminContactController from '../controllers/admin.contact.controller.js';

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
// ROUTES - All protected by auth + admin
// ============================================

/**
 * GET /api/admin/contact-submissions
 * List all contact form submissions (read-only)
 */
router.get(
  '/',
  adminAuthMiddleware,
  adminContactController.listContactSubmissions
);

export default router;
