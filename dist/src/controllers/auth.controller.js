import { z } from 'zod';
import * as authService from '../services/auth.service.js';

const requestOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    purpose: z.enum(['login','signup','forgot']).optional()
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    purpose: z.enum(['login','signup','forgot']).optional(),
    name: z.string().optional()
  })
});

export const requestOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    const data = await authService.requestOtp(email, purpose);
    console.log(data.debug ? '🔧 Mock OTP generated for' : '✅ OTP email sent to', email);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data
    });
  } catch (e) { next(e); }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, code, purpose, name } = req.body;
    const data = await authService.verifyOtp({ email, code, purpose, name });
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data
    });
  } catch (e) { next(e); }
};

export const validators = { requestOtpSchema, verifyOtpSchema };
