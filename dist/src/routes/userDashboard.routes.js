/**
 * User Dashboard Routes
 * 
 * Routes for user dashboard and orders listing
 * All routes require authentication via protect middleware
 */

import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { getDashboard, getOrders } from '../controllers/userDashboard.controller.js';

const router = Router();

/**
 * GET /user/dashboard
 * Get comprehensive dashboard data
 * @auth Required
 * @query {page?, limit?}
 */
router.get('/dashboard', protect, getDashboard);

/**
 * GET /user/orders
 * Get paginated list of user's orders
 * @auth Required
 * @query {page?, limit?, sort?}
 */
router.get('/orders', protect, getOrders);

export default router;
