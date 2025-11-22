// ADMIN: users
/**
 * Admin User Routes
 * Admin-only endpoints for user management
 */

import express from 'express';
const router = express.Router();
// Import auth middlewares with proper named exports
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

import * as adminUserController from '../controllers/admin.user.controller.js';

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
  if (process.env.FEATURE_ADMIN_USERS !== 'true') {
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
 * POST /api/admin/users
 * Create admin user
 */
router.post(
  '/',
  adminAuthMiddleware,
  adminUserController.createAdminUser
);

/**
 * GET /api/admin/users
 * List admin users with pagination and search
 */
router.get(
  '/',
  adminAuthMiddleware,
  adminUserController.listAdminUsers
);

/**
 * GET /api/admin/users/:id
 * Get admin user by ID
 */
router.get(
  '/:id',
  adminAuthMiddleware,
  adminUserController.getAdminUser
);

/**
 * PUT /api/admin/users/:id
 * Update admin user
 */
router.put(
  '/:id',
  adminAuthMiddleware,
  adminUserController.updateAdminUser
);

/**
 * DELETE /api/admin/users/:id
 * Delete (soft delete) admin user
 */
router.delete(
  '/:id',
  adminAuthMiddleware,
  adminUserController.deleteAdminUser
);

export default router;
