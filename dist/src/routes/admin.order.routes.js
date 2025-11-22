// CONVERTED TO ESM
/**
 * Admin Order Routes
 * Admin-only endpoints for orders and billing management
 */

import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// Import auth middlewares with proper named exports
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

import * as adminOrderController from '../controllers/admin.order.controller.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======= DEV TESTING: optional auth bypass (REMOVE BEFORE PRODUCTION) =======
// If you set FEATURE_ADMIN_ORDERS_BYPASS=true in .env, this middleware
// will mark the request as coming from an admin so you can test endpoints
// without a real JWT/admin login.
const devBypassAuth = (req, res, next) => {
  // attach a fake admin object used by downstream handlers
  req.user = { _id: 'DEV_ADMIN', name: 'Dev Admin', role: 'admin' };
  // some controllers use req.admin historically — keep both
  req.admin = { _id: 'DEV_ADMIN', name: 'Dev Admin', role: 'admin' };
  next();
};

// Choose middleware based on env flag. In dev you can set FEATURE_ADMIN_ORDERS_BYPASS=true
let adminAuthMiddleware;
if (process.env.FEATURE_ADMIN_ORDERS_BYPASS === 'true') {
  adminAuthMiddleware = devBypassAuth;
} else {
  // use the real project middlewares when bypass is disabled
  // keep the original import names (assumes these were imported earlier in the file)
  adminAuthMiddleware = [requireAuth, requireAdmin];
}

// TODO (IMPORTANT): Remove this bypass or set FEATURE_ADMIN_ORDERS_BYPASS=false before deploying to production.

// ============================================
// FEATURE FLAG CHECK
// ============================================
router.use((req, res, next) => {
  if (process.env.FEATURE_ADMIN_ORDERS !== 'true') {
    return res.status(404).json({
      ok: false,
      error: 'Feature disabled'
    });
  }
  next();
});

// ============================================
// MULTER CONFIGURATION
// ============================================
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter (optional - restrict file types)
const fileFilter = (req, file, cb) => {
  // Accept common document and image types
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ============================================
// ROUTES - All protected by auth + admin
// ============================================

/**
 * GET /api/admin/orders
 * List orders with pagination, search, and filters
 */
router.get(
  '/',
  adminAuthMiddleware,
  adminOrderController.listOrders
);

/**
 * GET /api/admin/orders/:id
 * Get order details by ID
 */
router.get(
  '/:id',
  adminAuthMiddleware,
  adminOrderController.getOrder
);

/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put(
  '/:id/status',
  adminAuthMiddleware,
  adminOrderController.updateOrderStatus
);

/**
 * PUT /api/admin/orders/:id/assign
 * Assign vendor and/or driver to order
 */
router.put(
  '/:id/assign',
  adminAuthMiddleware,
  adminOrderController.assignVendorDriver
);

/**
 * POST /api/admin/orders/:id/upload
 * Upload attachment to order
 */
router.post(
  '/:id/upload',
  adminAuthMiddleware,
  upload.single('attachment'),
  adminOrderController.uploadAttachment
);

/**
 * GET /api/admin/orders/:id/invoice
 * Get invoice JSON payload for order
 */
router.get(
  '/:id/invoice',
  adminAuthMiddleware,
  adminOrderController.getInvoicePayload
);

/**
 * POST /api/admin/orders/:id/convert
 * Convert quote to order (if Quote model exists)
 */
router.post(
  '/:id/convert',
  adminAuthMiddleware,
  adminOrderController.convertQuoteToOrder
);

// ============================================
// ERROR HANDLER FOR MULTER
// ============================================
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        ok: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      ok: false,
      error: `Upload error: ${error.message}`
    });
  }
  
  if (error) {
    return res.status(400).json({
      ok: false,
      error: error.message || 'Upload failed'
    });
  }
  
  next();
});

export default router;
