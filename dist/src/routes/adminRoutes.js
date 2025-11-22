// kk-backend/routes/adminRoutes.js
import express from 'express';

// Import correct adminUserController functions
import {
  loginAdmin as login,
  logoutAdmin as logout,
  listUsers
} from '../controllers/adminUserController.js';

import { requireAdmin } from '../middlewares/auth.js';

// PRODUCTS controller
import * as adminProductCtrl from '../controllers/adminProductController.js';

const router = express.Router();

// ---------------- AUTH ------------------
router.post('/login', login);
router.post('/logout', logout);

// ---------------- PRODUCTS ------------------
router.get('/products', requireAdmin, adminProductCtrl.listProducts);
router.get('/products/:id', requireAdmin, adminProductCtrl.getProduct);
router.post('/products', requireAdmin, adminProductCtrl.createProduct);
router.put('/products/:id', requireAdmin, adminProductCtrl.updateProduct);
router.delete('/products/:id', requireAdmin, adminProductCtrl.deleteProduct);

// ---------------- USERS ------------------
router.get('/users', requireAdmin, listUsers);

export default router;
