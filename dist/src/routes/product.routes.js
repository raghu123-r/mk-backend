import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { allowRoles } from '../middlewares/roles.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.js';
import { create, list, validators, getBySlugController } from '../controllers/product.controller.js';

const router = Router();

// LIST PRODUCTS — FIXED
router.get('/', validate(validators.listSchema), list);

// CREATE PRODUCT
router.post(
  '/',
  protect,
  allowRoles(ROLES.ADMIN),
  validate(validators.createSchema),
  create
);

// GET PRODUCT BY SLUG (controller wrapper)
router.get('/:slug', getBySlugController);

export default router;
