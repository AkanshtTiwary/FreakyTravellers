/**
 * Authentication Routes
 * All routes related to user authentication
 */

const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  sendOTP,
  verifyOTP,
  loginWithOTP,
  getMe,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  googleAuth,
} = require('../controllers/authController');

const {
  validateSignup,
  validateLogin,
  validateOTP,
  sanitizeInput,
} = require('../middleware/validator');

const { protect } = require('../middleware/authMiddleware');

const {
  authLimiter,
  otpLimiter,
  createAccountLimiter,
} = require('../middleware/rateLimiter');

// ========== PUBLIC ROUTES ==========

// User Registration & Authentication
router.post('/signup', createAccountLimiter, sanitizeInput, validateSignup, signup);
router.post('/login', authLimiter, sanitizeInput, validateLogin, login);

// Google OAuth
router.post('/google', authLimiter, googleAuth);

// OTP Routes
router.post('/send-otp', otpLimiter, sanitizeInput, sendOTP);
router.post('/verify-otp', sanitizeInput, validateOTP, verifyOTP);
router.post('/login-with-otp', authLimiter, sanitizeInput, validateOTP, loginWithOTP);

// Password Management
router.post('/forgot-password', authLimiter, sanitizeInput, forgotPassword);
router.post('/reset-password', authLimiter, sanitizeInput, resetPassword);

// ========== PROTECTED ROUTES ==========

// User Profile
router.get('/me', protect, getMe);
router.put('/profile', protect, sanitizeInput, updateProfile);
router.put('/change-password', protect, sanitizeInput, changePassword);

// Logout
router.post('/logout', protect, logout);

module.exports = router;
