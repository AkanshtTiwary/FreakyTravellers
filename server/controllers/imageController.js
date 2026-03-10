/**
 * Image Controller
 * Handles destination image fetching requests
 */

const {
  fetchDestinationImages,
  fetchMultipleDestinations,
  clearImageCache,
  getCacheStats,
} = require('../services/imageService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get images for a single destination
 * @route   GET /api/images/destination/:destination
 * @access  Public
 */
exports.getDestinationImages = asyncHandler(async (req, res) => {
  const { destination } = req.params;
  const { useCache } = req.query;

  if (!destination) {
    return res.status(400).json({
      success: false,
      message: 'Destination parameter is required',
    });
  }

  console.log(`\n📸 Fetching images for: ${destination}`);

  const result = await fetchDestinationImages(destination, {
    useCache: useCache !== 'false', // Default true unless explicitly false
  });

  res.status(200).json(result);
});

/**
 * @desc    Get images for multiple destinations
 * @route   POST /api/images/destinations
 * @access  Public
 */
exports.getMultipleDestinationImages = asyncHandler(async (req, res) => {
  const { destinations } = req.body;

  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Destinations array is required',
    });
  }

  if (destinations.length > 10) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 10 destinations allowed per request',
    });
  }

  console.log(`\n📸 Fetching images for ${destinations.length} destinations`);

  const result = await fetchMultipleDestinations(destinations);

  res.status(200).json(result);
});

/**
 * @desc    Search images by keyword
 * @route   GET /api/images/search
 * @access  Public
 */
exports.searchImages = asyncHandler(async (req, res) => {
  const { q, query } = req.query;
  const searchQuery = q || query;

  if (!searchQuery) {
    return res.status(400).json({
      success: false,
      message: 'Search query parameter (q or query) is required',
    });
  }

  console.log(`\n🔍 Searching images for: ${searchQuery}`);

  const result = await fetchDestinationImages(searchQuery);

  res.status(200).json(result);
});

/**
 * @desc    Clear image cache
 * @route   DELETE /api/images/cache
 * @access  Private (Admin only)
 */
exports.clearCache = asyncHandler(async (req, res) => {
  console.log('\n🗑️  Clearing image cache...');

  const result = clearImageCache();

  res.status(200).json({
    success: true,
    message: 'Image cache cleared successfully',
    ...result,
  });
});

/**
 * @desc    Get cache statistics
 * @route   GET /api/images/cache/stats
 * @access  Private (Admin only)
 */
exports.getCacheStatistics = asyncHandler(async (req, res) => {
  const stats = getCacheStats();

  res.status(200).json({
    success: true,
    cache: stats,
  });
});

/**
 * @desc    Health check for image service
 * @route   GET /api/images/health
 * @access  Public
 */
exports.healthCheck = asyncHandler(async (req, res) => {
  // Check which API keys are configured
  const apiStatus = {
    unsplash: !!process.env.UNSPLASH_ACCESS_KEY,
    pexels: !!process.env.PEXELS_API_KEY,
    pixabay: !!process.env.PIXABAY_API_KEY,
    wikimedia: true, // Always available (no key required)
  };

  const configuredApis = Object.entries(apiStatus)
    .filter(([_, configured]) => configured)
    .map(([api, _]) => api);

  res.status(200).json({
    success: true,
    message: 'Image service is operational',
    apis: apiStatus,
    configuredApis,
    fallbackAvailable: true,
  });
});
