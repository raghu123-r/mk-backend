import { body, validationResult } from 'express-validator';

export const addAddressRules = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ min: 2, max: 80 }),
  body('phone').trim().matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('line1').trim().notEmpty().withMessage('Address line1 required'),
  body('city').trim().notEmpty().withMessage('City required'),
  body('state').trim().notEmpty().withMessage('State required'),
  body('country').trim().notEmpty().withMessage('Country required'),
  body('pincode').trim().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits')
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
