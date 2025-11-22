import { Router } from 'express';
import { protect, } from '../middlewares/auth.js';
import { allowRoles } from '../middlewares/roles.js';
import { ROLES } from '../constants/roles.js';
import { upload, uploadImage } from '../controllers/upload.controller.js';

const router = Router();
router.post('/image', protect, allowRoles(ROLES.ADMIN), upload.single('image'), uploadImage);
export default router;

