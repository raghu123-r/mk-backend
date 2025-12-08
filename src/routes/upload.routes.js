import { Router } from 'express';
import { protect, requireAuth, requireAdmin } from '../middlewares/auth.js';
import { allowRoles } from '../middlewares/roles.js';
import { ROLES } from '../constants/roles.js';
import { upload, uploadImage, uploadFiles, listUploads } from '../controllers/upload.controller.js';

const router = Router();

// Existing single image upload endpoint
router.post('/image', protect, allowRoles(ROLES.ADMIN), upload.single('image'), uploadImage);

// Admin endpoints for media manager
// POST /api/upload/admin - Upload one or multiple files
router.post('/admin', requireAuth, requireAdmin, upload.array('files', 10), uploadFiles);

// GET /api/upload/admin - List uploaded files
router.get('/admin', requireAuth, requireAdmin, listUploads);

export default router;

