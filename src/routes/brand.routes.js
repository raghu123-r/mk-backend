import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { allowRoles } from '../middlewares/roles.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.js';
import { create, list, getById, update, remove, validators } from '../controllers/brand.controller.js';

const router = Router();
router.get('/', list);
router.get('/:id', getById);
router.post('/', protect, allowRoles(ROLES.ADMIN), validate(validators.createSchema), create);
router.put('/:id', protect, allowRoles(ROLES.ADMIN), validate(validators.updateSchema), update);
router.delete('/:id', protect, allowRoles(ROLES.ADMIN), remove);
export default router;

