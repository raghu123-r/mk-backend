/* ESM version */
import express from 'express';
import { login } from '../controllers/admin.auth.controller.js';

const router = express.Router();

// ensure body parser / json middleware present in app.js; but add local json middleware to be safe
router.post('/auth/login', express.json(), login);

export default router;
