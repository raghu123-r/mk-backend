// kk-backend/routes/adminRoutes.js
import express from 'express';

// Import correct adminUserController functions
import {
  loginAdmin as login,
  logoutAdmin as logout,
  listUsers
} from '../controllers/adminUserController.js';

import { requireAuth, requireAdmin } from '../middlewares/auth.js';

// PRODUCTS controller
import * as adminProductCtrl from '../controllers/adminProductController.js';

// COUPONS routes
import couponRoutes from './admin.coupon.routes.js';

const router = express.Router();

// ---------------- AUTH ------------------
// Login endpoint - no auth required
router.post('/login', login);
// Logout should be protected
router.post('/logout', requireAuth, requireAdmin, logout);

// ---------------- PRODUCTS ------------------
router.get('/products', requireAuth, requireAdmin, adminProductCtrl.listProducts);
router.get('/products/:id', requireAuth, requireAdmin, adminProductCtrl.getProduct);
router.post('/products', requireAuth, requireAdmin, adminProductCtrl.createProduct);
router.put('/products/:id', requireAuth, requireAdmin, adminProductCtrl.updateProduct);
router.delete('/products/:id', requireAuth, requireAdmin, adminProductCtrl.deleteProduct);

// ---------------- USERS ------------------
router.get('/users', requireAuth, requireAdmin, listUsers);

// ---------------- COUPONS ------------------
router.use('/coupons', couponRoutes);

export default router;
