import { Router } from "express";

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import brandRoutes from './brand.routes.js';
import orderRoutes from './order.routes.js';
import uploadRoutes from './upload.routes.js';
import categoryRoutes from './category.routes.js';
import contactRoutes from './contact.routes.js';

// ⭐ Your new file
import contactInfoRoutes from "./contactInfo.routes.js";

// ADAPTERS (leave them as they are)
import authAliases from './aliases.auth.js';
import brandAliases from './aliases.brand.js';
import orderAliases from './aliases.order.js';
import rootAliases from './aliases.root.js';

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/contact', contactRoutes);

// ⭐ This route serves your contact info JSON
router.use('/contact-info', contactInfoRoutes);

router.use('/auth', authRoutes);
router.use('/auth', authAliases);

router.use('/users', userRoutes);
router.use('/products', productRoutes);

router.use('/brands', brandRoutes);
router.use('/brands', brandAliases);

router.use('/orders', orderRoutes);
router.use('/orders', orderAliases);

router.use('/upload', uploadRoutes);

// Root alias mounts
router.use('/', rootAliases);

export default router;
