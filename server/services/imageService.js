/**
 * Image Service
 * Multi-API image fetching with intelligent fallbacks
 * 
 * API Priority Order:
 * 1. Unsplash (Primary) - High quality travel photos
 * 2. Pexels (Fallback 1) - Excellent quality, generous limits
 * 3. Pixabay (Fallback 2) - Good quality, free
 * 4. Wikimedia Commons (Fallback 3) - No key required, unlimited
 * 
 * Features:
 * - Automatic fallback on rate limit or error
 * - Smart search query optimization
 * - In-memory caching (24 hours)
 * - Error handling and retry logic
 */

const axios = require('axios');
const TTLCache = require('../utils/cache');
const logger = require('../utils/logger');

// ==================== IN-MEMORY CACHE (using centralized TTL cache utility) ====================
const imageCache = new TTLCache(1440); // 24 hours (1440 minutes) TTL

/**
 * Cache Management
 */
const getCachedImages = (destination) => {
  const key = destination.toLowerCase();
  const cached = imageCache.get(key);
  if (cached) {
    logger.debug(`Cache hit for: ${destination}`);
    return cached;
  }
  return null;
};

const setCachedImages = (destination, data) => {
  const key = destination.toLowerCase();
  imageCache.set(key, data);
  logger.debug(`Cached images for: ${destination}`);
};

// ==================== SEARCH QUERY OPTIMIZATION ====================

/**
 * Generate smart search queries for better results
 * @param {string} destination - Destination name
 * @returns {string[]} Array of optimized search queries
 */
const generateSearchQueries = (destination) => {
  return [
    `${destination} India tourism`,
    `${destination} travel photography`,
    `${destination} famous places`,
    `${destination} city view`,
    `${destination} landmark`,
  ];
};

// ==================== UNSPLASH API ====================

/**
 * Fetch images from Unsplash API
 * @param {string} destination - Destination name
 * @returns {Promise<Array>} Array of image objects
 */
const fetchFromUnsplash = async (destination) => {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!accessKey) {
      logger.warn('Unsplash API key not configured');
      return null;
    }

    const queries = generateSearchQueries(destination);
    
    // Try first query
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: queries[0],
        per_page: 10,
        orientation: 'landscape',
      },
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
      },
      timeout: 5000,
    });

    if (response.data.results && response.data.results.length > 0) {
      logger.debug(`Unsplash: Found ${response.data.results.length} images`);
      
      return response.data.results.map(img => ({
        url: img.urls.regular,
        thumbnail: img.urls.small,
        photographer: img.user.name,
        photographerUrl: img.user.links.html,
        source: 'unsplash',
        alt: img.alt_description || `${destination} travel photo`,
        width: img.width,
        height: img.height,
        downloadUrl: img.links.download,
      }));
    }

    return null;
  } catch (error) {
    // Handle rate limiting
    if (error.response?.status === 403 || error.response?.status === 429) {
      logger.warn('Unsplash: Rate limit exceeded');
    } else {
      logger.debug(`Unsplash error: ${error.message}`);
    }
    return null;
  }
};

// ==================== PEXELS API ====================

/**
 * Fetch images from Pexels API
 * @param {string} destination - Destination name
 * @returns {Promise<Array>} Array of image objects
 */
const fetchFromPexels = async (destination) => {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    
    if (!apiKey) {
      logger.warn('Pexels API key not configured');
      return null;
    }

    const queries = generateSearchQueries(destination);
    
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query: queries[0],
        per_page: 10,
        orientation: 'landscape',
      },
      headers: {
        'Authorization': apiKey,
      },
      timeout: 5000,
    });

    if (response.data.photos && response.data.photos.length > 0) {
      logger.debug(`Pexels: Found ${response.data.photos.length} images`);
      
      return response.data.photos.map(img => ({
        url: img.src.large,
        thumbnail: img.src.medium,
        photographer: img.photographer,
        photographerUrl: img.photographer_url,
        source: 'pexels',
        alt: img.alt || `${destination} travel photo`,
        width: img.width,
        height: img.height,
        avgColor: img.avg_color,
      }));
    }

    return null;
  } catch (error) {
    if (error.response?.status === 429) {
      logger.warn('Pexels: Rate limit exceeded');
    } else {
      logger.debug(`Pexels error: ${error.message}`);
    }
    return null;
  }
};

// ==================== PIXABAY API ====================

/**
 * Fetch images from Pixabay API
 * @param {string} destination - Destination name
 * @returns {Promise<Array>} Array of image objects
 */
const fetchFromPixabay = async (destination) => {
  try {
    const apiKey = process.env.PIXABAY_API_KEY;
    
    if (!apiKey) {
      logger.warn('Pixabay API key not configured');
      return null;
    }

    const queries = generateSearchQueries(destination);
    
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: apiKey,
        q: queries[0],
        image_type: 'photo',
        orientation: 'horizontal',
        per_page: 10,
        safesearch: true,
      },
      timeout: 5000,
    });

    if (response.data.hits && response.data.hits.length > 0) {
      logger.debug(`Pixabay: Found ${response.data.hits.length} images`);
      
      return response.data.hits.map(img => ({
        url: img.largeImageURL,
        thumbnail: img.webformatURL,
        photographer: img.user,
        photographerUrl: `https://pixabay.com/users/${img.user}-${img.user_id}/`,
        source: 'pixabay',
        alt: img.tags || `${destination} travel photo`,
        width: img.imageWidth,
        height: img.imageHeight,
        views: img.views,
        likes: img.likes,
      }));
    }

    return null;
  } catch (error) {
    if (error.response?.status === 429) {
      logger.warn('Pixabay: Rate limit exceeded');
    } else {
      logger.debug(`Pixabay error: ${error.message}`);
    }
    return null;
  }
};

// ==================== WIKIMEDIA COMMONS API ====================

/**
 * Fetch images from Wikimedia Commons (No API key required)
 * @param {string} destination - Destination name
 * @returns {Promise<Array>} Array of image objects
 */
const fetchFromWikimedia = async (destination) => {
  try {
    // Search for images related to destination
    const searchResponse = await axios.get('https://commons.wikimedia.org/w/api.php', {
      params: {
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: `${destination} India`,
        gsrnamespace: 6, // File namespace
        gsrlimit: 10,
        prop: 'imageinfo',
        iiprop: 'url|size|extmetadata',
        iiurlwidth: 800,
      },
      timeout: 5000,
    });

    const pages = searchResponse.data?.query?.pages;
    
    if (pages) {
      const images = Object.values(pages)
        .filter(page => page.imageinfo && page.imageinfo[0])
        .map(page => {
          const info = page.imageinfo[0];
          const metadata = info.extmetadata || {};
          
          return {
            url: info.url,
            thumbnail: info.thumburl || info.url,
            photographer: metadata.Artist?.value?.replace(/<[^>]*>/g, '') || 'Unknown',
            photographerUrl: page.canonicalurl,
            source: 'wikimedia',
            alt: page.title?.replace('File:', '') || `${destination} photo`,
            width: info.width,
            height: info.height,
            license: metadata.License?.value || 'Unknown',
          };
        });

      if (images.length > 0) {
        logger.debug(`Wikimedia: Found ${images.length} images`);
        return images;
      }
    }

    return null;
  } catch (error) {
    logger.debug(`Wikimedia error: ${error.message}`);
    return null;
  }
};

// ==================== MAIN FETCH FUNCTION ====================

/**
 * Fetch destination images with intelligent fallback
 * @param {string} destination - Destination name
 * @param {object} options - Options {useCache: boolean}
 * @returns {Promise<object>} Result object with images and metadata
 */
const fetchDestinationImages = async (destination, options = {}) => {
  const { useCache = true } = options;

  logger.debug(`Fetching images for: ${destination}`);

  // Check cache first
  if (useCache) {
    const cached = getCachedImages(destination);
    if (cached) {
      return {
        success: true,
        destination,
        images: cached.images,
        source: cached.source,
        fromCache: true,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Try APIs in priority order
  const apis = [
    { name: 'Unsplash', fetch: fetchFromUnsplash },
    { name: 'Pexels', fetch: fetchFromPexels },
    { name: 'Pixabay', fetch: fetchFromPixabay },
    { name: 'Wikimedia Commons', fetch: fetchFromWikimedia },
  ];

  for (const api of apis) {
    logger.debug(`Trying ${api.name}...`);
    
    try {
      const images = await api.fetch(destination);
      
      if (images && images.length > 0) {
        const result = {
          success: true,
          destination,
          images: images.slice(0, 8), // Return max 8 images
          source: api.name.toLowerCase().replace(/\s+/g, '_'),
          fromCache: false,
          timestamp: new Date().toISOString(),
        };

        // Cache the result
        if (useCache) {
          setCachedImages(destination, result);
        }

        logger.debug(`Successfully fetched images from ${api.name}`);
        return result;
      }
    } catch (error) {
      logger.debug(`${api.name} failed: ${error.message}`);
      continue;
    }
  }

  // All APIs failed - return fallback response
  logger.warn('All image APIs failed, using fallback');
  
  return {
    success: false,
    destination,
    images: [],
    source: 'fallback',
    message: 'Unable to fetch images at this time. Please try again later.',
    fallbackImage: {
      url: 'https://via.placeholder.com/800x450?text=Travel+Destination',
      thumbnail: 'https://via.placeholder.com/400x225?text=Travel+Destination',
      photographer: 'Placeholder',
      source: 'fallback',
      alt: `${destination} - Image unavailable`,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Fetch images for multiple destinations
 * @param {string[]} destinations - Array of destination names
 * @returns {Promise<object>} Results for all destinations
 */
const fetchMultipleDestinations = async (destinations) => {
  logger.debug(`Fetching images for ${destinations.length} destinations...`);

  const results = await Promise.all(
    destinations.map(dest => fetchDestinationImages(dest))
  );

  const response = {
    success: true,
    count: results.length,
    destinations: {},
    timestamp: new Date().toISOString(),
  };

  results.forEach((result, index) => {
    response.destinations[destinations[index]] = result;
  });

  return response;
};

/**
 * Clear image cache (utility function)
 */
const clearImageCache = () => {
  const size = imageCache.size;
  imageCache.clear();
  logger.debug(`Cleared ${size} cached image entries`);
  return { success: true, cleared: size };
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  const stats = {
    totalEntries: imageCache.size,
    entries: [],
  };

  imageCache.forEach((value, key) => {
    stats.entries.push({
      destination: key,
      imageCount: value.data.images?.length || 0,
      source: value.data.source,
      age: Math.round((Date.now() - value.timestamp) / 1000 / 60), // minutes
    });
  });

  return stats;
};

// ==================== EXPORTS ====================

module.exports = {
  fetchDestinationImages,
  fetchMultipleDestinations,
  clearImageCache,
  getCacheStats,
};
