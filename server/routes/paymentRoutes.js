/**
 * Payment Routes
 * All routes related to payments and bookings
 */

const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  paymentFailed,
  getBookingById,
  getMyBookings,
  getAllBookings,
  cancelBooking,
  getBookingStats,
  getPaymentDetails,
} = require('../controllers/paymentController');

const {
  validateBooking,
  validatePaymentVerification,
  validateMongoId,
  validatePagination,
  sanitizeInput,
} = require('../middleware/validator');

const { protect, authorize } = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');

// ========== PROTECTED ROUTES ==========

// Create payment order
router.post(
  '/create-order',
  protect,
  paymentLimiter,
  sanitizeInput,
  validateBooking,
  createOrder
);

// Verify payment
router.post(
  '/verify-payment',
  protect,
  sanitizeInput,
  validatePaymentVerification,
  verifyPayment
);

// Payment failure handler
router.post('/payment-failed', protect, sanitizeInput, paymentFailed);

// User's bookings
router.get('/my-bookings', protect, validatePagination, getMyBookings);

// Single booking operations
router.get('/bookings/:id', protect, validateMongoId('id'), getBookingById);
router.post('/bookings/:id/cancel', protect, sanitizeInput, validateMongoId('id'), cancelBooking);

// ========== ADMIN ROUTES ==========

// Get all bookings (admin only)
router.get('/bookings', protect, authorize('admin'), validatePagination, getAllBookings);

// Get booking statistics (admin only)
router.get('/stats', protect, authorize('admin'), getBookingStats);

// Get payment details from Razorpay (admin only)
router.get('/payment/:paymentId', protect, authorize('admin'), getPaymentDetails);

module.exports = router;
