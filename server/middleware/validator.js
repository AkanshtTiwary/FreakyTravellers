/**
 * Validation Middleware
 * Input validation and sanitization using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }

  next();
};

/**
 * Validation Rules for User Registration
 */
const validateSignup = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),

  handleValidationErrors,
];

/**
 * Validation Rules for User Login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors,
];

/**
 * Validation Rules for OTP Verification
 */
const validateOTP = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),

  handleValidationErrors,
];

/**
 * Validation Rules for Trip Search
 */
const validateTripSearch = [
  body('source')
    .trim()
    .notEmpty()
    .withMessage('Source city is required')
    .isLength({ min: 2 })
    .withMessage('Source city must be at least 2 characters'),

  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination city is required')
    .isLength({ min: 2 })
    .withMessage('Destination city must be at least 2 characters'),

  body('totalBudget')
    .notEmpty()
    .withMessage('Total budget is required')
    .isNumeric()
    .withMessage('Budget must be a number')
    .custom((value) => {
      if (parseFloat(value) < 1) {
        throw new Error('Budget must be at least ₹1');
      }
      if (parseFloat(value) > 1000000) {
        throw new Error('Maximum budget cannot exceed ₹10,00,000');
      }
      return true;
    }),

  body('numberOfTravelers')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of travelers must be between 1 and 10'),

  handleValidationErrors,
];

/**
 * Validation Rules for Booking Creation
 */
const validateBooking = [
  body('tripId')
    .notEmpty()
    .withMessage('Trip ID is required')
    .isMongoId()
    .withMessage('Invalid Trip ID'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => value > 0)
    .withMessage('Amount must be greater than 0'),

  body('contactDetails.name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Contact name must be at least 2 characters'),

  body('contactDetails.email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid contact email'),

  body('contactDetails.phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),

  handleValidationErrors,
];

/**
 * Validation Rules for Payment Verification
 */
const validatePaymentVerification = [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),

  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),

  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),

  handleValidationErrors,
];

/**
 * Validation Rules for MongoDB ObjectId
 */
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),

  handleValidationErrors,
];

/**
 * Validation Rules for Pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors,
];

/**
 * Sanitize input to prevent XSS and injection attacks
 */
const sanitizeInput = (req, res, next) => {
  // Remove any HTML tags from string inputs
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/<[^>]*>/g, '').trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

module.exports = {
  handleValidationErrors,
  validateSignup,
  validateLogin,
  validateOTP,
  validateTripSearch,
  validateBooking,
  validatePaymentVerification,
  validateMongoId,
  validatePagination,
  sanitizeInput,
};
