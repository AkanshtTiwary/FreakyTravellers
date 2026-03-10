/**
 * Travel Plan Routes
 * Budget-Adaptive Travel Intelligence System endpoints
 */

const express    = require('express');
const router     = express.Router();
const { body, validationResult } = require('express-validator');

const {
  generatePlan,
  generateMinimumFare,
  getPlanHistory,
  getPlanById,
  savePlan,
  deletePlan,
} = require('../controllers/travelPlan.controller');

const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { searchLimiter }         = require('../middleware/rateLimiter');

// ---------------------------------------------------------------------------
// Shared input validation rules
// ---------------------------------------------------------------------------
const validateTravelPlanInput = [
  body('source')
    .trim()
    .notEmpty().withMessage('Source city is required')
    .isLength({ max: 100 }).withMessage('Source must be under 100 characters'),

  body('destination')
    .trim()
    .notEmpty().withMessage('Destination city is required')
    .isLength({ max: 100 }).withMessage('Destination must be under 100 characters'),

  body('budget')
    .notEmpty().withMessage('Budget is required')
    .isFloat({ min: 1 }).withMessage('Budget must be at least 1'),

  body('currency')
    .optional()
    .trim()
    .isLength({ min: 3, max: 5 }).withMessage('Currency must be a valid ISO code'),

  body('travelers')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Travelers must be between 1 and 50'),

  body('dates.from')
    .optional()
    .isISO8601().withMessage('dates.from must be a valid ISO date'),

  body('dates.to')
    .optional()
    .isISO8601().withMessage('dates.to must be a valid ISO date'),

  // Middleware to return validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.param, message: e.msg })),
      });
    }
    next();
  },
];

// ---------------------------------------------------------------------------
// PUBLIC / SEMI-PROTECTED ROUTES
// ---------------------------------------------------------------------------

// Generate a full travel plan (works with or without auth)
router.post(
  '/plan',
  searchLimiter,
  optionalAuth,
  validateTravelPlanInput,
  generatePlan
);

// Generate minimum fare plan (works with or without auth)
router.post(
  '/minimum-fare',
  searchLimiter,
  optionalAuth,
  validateTravelPlanInput,
  generateMinimumFare
);

// ---------------------------------------------------------------------------
// PROTECTED ROUTES (JWT required)
// ---------------------------------------------------------------------------

// Get plan history for logged-in user
router.get('/history', protect, getPlanHistory);

// Get single plan by ID
router.get('/plan/:planId', protect, getPlanById);

// Save a plan to user profile
router.post('/save/:planId', protect, savePlan);

// Delete a saved plan
router.delete('/plan/:planId', protect, deletePlan);

module.exports = router;
