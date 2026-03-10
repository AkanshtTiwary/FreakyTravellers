/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
});

/**
 * Strict rate limiter for authentication routes
 * 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * OTP request rate limiter
 * 3 OTP requests per 10 minutes
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 OTP requests
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 10 minutes',
  },
  skipFailedRequests: false,
});

/**
 * Payment rate limiter
 * 10 payment attempts per hour
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many payment attempts, please try again after an hour',
  },
  skipSuccessfulRequests: false,
});

/**
 * Search rate limiter
 * 30 searches per 10 minutes
 */
const searchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: {
    success: false,
    message: 'Too many search requests, please try again in a few minutes',
  },
  skipSuccessfulRequests: false,
});

/**
 * Create account rate limiter
 * 3 account creations per hour per IP
 */
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many accounts created from this IP, please try again after an hour',
  },
  skipFailedRequests: true,
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  paymentLimiter,
  searchLimiter,
  createAccountLimiter,
};
