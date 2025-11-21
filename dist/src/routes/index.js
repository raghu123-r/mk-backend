import { Router } from "express";

import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';
import brandRoutes from './brand.routes.js';
import orderRoutes from './order.routes.js';
import uploadRoutes from './upload.routes.js';
import categoryRoutes from './category.routes.js';
import cartRoutes from './cart.routes.js';
// ADMIN AUTH: Admin authentication routes (ESM import)
import adminAuthRoutes from './admin.auth.routes.js';
import contactRoutes from './contact.routes.js';

// ⭐ Your new file
import contactInfoRoutes from "./contactInfo.routes.js";

// USER DASHBOARD: User profile and dashboard routes
import userProfileRoutes from './userProfile.routes.js';
import userDashboardRoutes from './userDashboard.routes.js';

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

// ADMIN AUTH: Mount admin authentication routes
router.use('/admin', adminAuthRoutes);

if (process.env.FEATURE_ADMIN_ORDERS === 'true') {
  (async () => {
    const mod = await import('./admin.order.routes.js');
    const adminOrdersRouter = mod.default || mod.router || mod;
    router.use('/admin/orders', adminOrdersRouter);
  })();
}

// Admin Invoices (feature-flagged)
if (process.env.FEATURE_ADMIN_INVOICES === 'true') {
  (async () => {
    const mod = await import('./admin.invoice.routes.js');
    const adminInvoicesRouter = mod.default || mod.router || mod;
    router.use('/admin/invoices', adminInvoicesRouter);
  })();
}

// Admin Users (feature-flagged)
if (process.env.FEATURE_ADMIN_USERS === 'true') {
  (async () => {
    const mod = await import('./admin.user.routes.js');
    const adminUsersRouter = mod.default || mod.router || mod;
    router.use('/admin/users', adminUsersRouter);
  })();
}

router.use('/users', userRoutes);
router.use('/products', productRoutes);

// USER DASHBOARD: Mount user profile and dashboard routes
router.use('/user', userProfileRoutes);
router.use('/user', userDashboardRoutes);

router.use('/cart', cartRoutes);

router.use('/brands', brandRoutes);
router.use('/brands', brandAliases);

router.use('/orders', orderRoutes);
router.use('/orders', orderAliases);

router.use('/upload', uploadRoutes);

// Root alias mounts
router.use('/', rootAliases);

export default router;
