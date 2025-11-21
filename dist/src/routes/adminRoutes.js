// kk-backend/routes/adminRoutes.js
import express from 'express';
import { login } from '../controllers/adminController.js';
import authenticate from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);

router.get('/protected', authenticate, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

export default router;
