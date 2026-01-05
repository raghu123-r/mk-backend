import express from 'express';
import {
  createVariant,
  getVariantsByProductAdmin,
  updateVariant,
  deleteVariant
} from '../controllers/productVariant.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Protect all admin variant routes
router.use(requireAuth, requireAdmin);

// Admin variant routes
// POST   /api/admin/products/:productId/variants
// GET    /api/admin/products/:productId/variants
// PATCH  /api/admin/products/:productId/variants/:variantId
// DELETE /api/admin/products/:productId/variants/:variantId

router.post('/:productId/variants', createVariant);
router.get('/:productId/variants', getVariantsByProductAdmin);
router.patch('/:productId/variants/:variantId', updateVariant);
router.delete('/:productId/variants/:variantId', deleteVariant);

export default router;
