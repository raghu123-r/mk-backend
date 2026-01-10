import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestsByOrder,
  updateReturnRequestStatus,
  validators
} from '../controllers/return.controller.js';

const router = Router();

// POST /api/returns - Create a new return request (protected)
router.post('/', protect, validate(validators.createReturnSchema), createReturnRequest);

// GET /api/returns/my - Get logged-in user's return requests (protected, paginated)
router.get('/my', protect, getMyReturnRequests);

// GET /api/returns/order/:orderId - Get return requests for a specific order (protected)
router.get('/order/:orderId', protect, getReturnRequestsByOrder);

// Note: Status updates moved to admin routes (/api/admin/returns/:id/status)
// Users can only view their return statuses, not update them

export default router;
