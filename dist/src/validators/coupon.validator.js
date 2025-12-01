import { body, validationResult } from 'express-validator';

export const createCouponRules = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Code can only contain letters, numbers, hyphens and underscores'),
  
  body('type')
    .isIn(['percentage', 'flat'])
    .withMessage('Type must be either percentage or flat'),
  
  body('value')
    .isFloat({ min: 1 })
    .withMessage('Value must be at least 1'),
  
  body('applicableProducts')
    .optional()
    .isArray()
    .withMessage('Applicable products must be an array'),
  
  body('applicableCategories')
    .optional()
    .isArray()
    .withMessage('Applicable categories must be an array'),
  
  body('applicableBrands')
    .optional()
    .isArray()
    .withMessage('Applicable brands must be an array'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  
  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO date'),
  
  body('usageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Usage limit must be a positive integer'),
  
  body('perUserLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Per user limit must be a positive integer'),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

export const updateCouponRules = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Code can only contain letters, numbers, hyphens and underscores'),
  
  body('type')
    .optional()
    .isIn(['percentage', 'flat'])
    .withMessage('Type must be either percentage or flat'),
  
  body('value')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Value must be at least 1'),
  
  body('applicableProducts')
    .optional()
    .isArray()
    .withMessage('Applicable products must be an array'),
  
  body('applicableCategories')
    .optional()
    .isArray()
    .withMessage('Applicable categories must be an array'),
  
  body('applicableBrands')
    .optional()
    .isArray()
    .withMessage('Applicable brands must be an array'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO date'),
  
  body('usageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Usage limit must be a positive integer'),
  
  body('perUserLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Per user limit must be a positive integer'),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

export const applyCouponRules = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required'),
  
  body('cartItems')
    .isArray({ min: 1 })
    .withMessage('Cart items array is required'),
  
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ID')
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      error: { message: 'Validation failed', details: errors.array() },
      data: null
    });
  }
  next();
};
