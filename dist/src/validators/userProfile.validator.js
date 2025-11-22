/**
 * User Profile Validation Rules
 * 
 * Validation rules for user profile update endpoint
 * Uses express-validator for request validation
 */

import { body, validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Validation rules for PATCH /user/profile
 * 
 * Validates:
 * - name: optional, string, 2-80 chars if present
 * - email: optional, valid email format if present
 * - phone: optional, exactly 10 digits if present
 */
export const updateProfileRules = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Phone must be exactly 10 digits')
];

/**
 * Middleware to handle validation errors
 * If validation fails, responds with 400 and error details
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    
    return res.status(400).json(
      errorResponse('Validation failed', formattedErrors)
    );
  }
  
  next();
};
