import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { requestOtp, verifyOtp, validators } from '../controllers/auth.controller.js';

const router = Router();

router.post('/request-otp', validate(validators.requestOtpSchema), requestOtp);
router.post('/verify-otp', validate(validators.verifyOtpSchema), verifyOtp);

export default router;

