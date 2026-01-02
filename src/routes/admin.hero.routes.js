/**
 * Admin Hero Management Routes
 * Admin-only endpoints for managing homepage hero images
 */
import { Router } from 'express';
import {
  getAllHeroImages,
  createHeroImage,
  updateHeroImage,
  deleteHeroImage
} from '../controllers/admin.hero.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import { upload } from '../controllers/upload.controller.js';

const router = Router();

// All routes require admin authentication
router.use(requireAuth, requireAdmin);

// GET /api/admin/hero-images - Get all hero images
router.get('/', getAllHeroImages);

// POST /api/admin/hero-images - Create new hero image(s)
router.post('/', upload.array('files', 10), createHeroImage);

// PUT /api/admin/hero-images/:id - Update hero image details
router.put('/:id', updateHeroImage);

// DELETE /api/admin/hero-images/:id - Delete hero image
router.delete('/:id', deleteHeroImage);

export default router;
