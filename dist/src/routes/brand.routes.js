import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { allowRoles } from '../middlewares/roles.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.js';
import { create, list, validators } from '../controllers/brand.controller.js';

const router = Router();
router.get('/', list);
router.post('/', protect, allowRoles(ROLES.ADMIN), validate(validators.createSchema), create);
export default router;

