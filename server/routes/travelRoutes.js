/**
 * Travel/Trip Routes
 * All routes related to trip planning and optimization
 */

const express = require('express');
const router = express.Router();
const {
  optimizeTrip,
  optimizeMultiDestinationTrip,
  getTripById,
  getMyTrips,
  getAllTrips,
  updateTripStatus,
  deleteTrip,
  getTripStats,
  getPopularDestinations,
} = require('../controllers/travelController');

const {
  validateTripSearch,
  validateMongoId,
  validatePagination,
  sanitizeInput,
} = require('../middleware/validator');

const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { searchLimiter } = require('../middleware/rateLimiter');

// ========== PUBLIC ROUTES ==========

// Get popular destinations
router.get('/popular-destinations', getPopularDestinations);

// ========== SEMI-PROTECTED ROUTES (Optional Auth) ==========

// Trip optimization - works with or without auth
router.post(
  '/optimize',
  searchLimiter,
  optionalAuth,
  sanitizeInput,
  validateTripSearch,
  optimizeTrip
);

// Multi-destination trip optimization with real API data
router.post(
  '/optimize-multi',
  searchLimiter,
  optionalAuth,
  sanitizeInput,
  optimizeMultiDestinationTrip
);

// ========== PROTECTED ROUTES ==========

// User's trips
router.get('/my-trips', protect, validatePagination, getMyTrips);

// Trip statistics
router.get('/stats', protect, getTripStats);

// Single trip operations
router.get('/:id', protect, validateMongoId('id'), getTripById);
router.put('/:id/status', protect, sanitizeInput, validateMongoId('id'), updateTripStatus);
router.delete('/:id', protect, validateMongoId('id'), deleteTrip);

// ========== ADMIN ROUTES ==========

// Get all trips (admin only)
router.get('/', protect, authorize('admin'), validatePagination, getAllTrips);

module.exports = router;
