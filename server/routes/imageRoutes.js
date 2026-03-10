/**
 * Image Routes
 * Routes for destination image fetching
 */

const express = require('express');
const router = express.Router();
const {
  getDestinationImages,
  getMultipleDestinationImages,
  searchImages,
  clearCache,
  getCacheStatistics,
  healthCheck,
} = require('../controllers/imageController');

const { protect } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/images/health
 * @desc    Health check for image service
 * @access  Public
 */
router.get('/health', healthCheck);

/**
 * @route   GET /api/images/destination/:destination
 * @desc    Get images for a single destination
 * @access  Public
 */
router.get('/destination/:destination', getDestinationImages);

/**
 * @route   POST /api/images/destinations
 * @desc    Get images for multiple destinations
 * @access  Public
 */
router.post('/destinations', getMultipleDestinationImages);

/**
 * @route   GET /api/images/search
 * @desc    Search images by keyword
 * @access  Public
 */
router.get('/search', searchImages);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/images/cache/stats
 * @desc    Get cache statistics
 * @access  Private (Admin)
 */
router.get('/cache/stats', protect, getCacheStatistics);

/**
 * @route   DELETE /api/images/cache
 * @desc    Clear image cache
 * @access  Private (Admin)
 */
router.delete('/cache', protect, clearCache);

module.exports = router;
