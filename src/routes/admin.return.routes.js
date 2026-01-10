/**
 * Admin Return Management Routes
 * Admin-only endpoints for managing return/refund requests
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import {
  getAllReturnRequests,
  updateReturnRequestStatus,
  getAllowedStatuses
} from '../controllers/return.controller.js';

const router = Router();

// Apply admin authentication middleware to all routes
router.use(requireAuth, requireAdmin);

// GET /api/admin/returns - Get all return requests with filtering and pagination
router.get('/', getAllReturnRequests);

// GET /api/admin/returns/:id/allowed-statuses - Get allowed next statuses for a return
router.get('/:id/allowed-statuses', getAllowedStatuses);

// PATCH /api/admin/returns/:id/status - Update return request status
router.patch('/:id/status', updateReturnRequestStatus);

export default router;
