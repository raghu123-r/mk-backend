/* ESM version */
import express from 'express';
import { login } from '../controllers/admin.auth.controller.js';

const router = express.Router();

// Login endpoint - no auth required
// ensure body parser / json middleware present in app.js; but add local json middleware to be safe
router.post('/auth/login', express.json(), login);

// All other admin routes are protected in their respective route files

export default router;
