/**
 * TTL-Based Cache Utility
 * Reusable caching utility with automatic expiration
 * 
 * Usage:
 *   const TTLCache = require('./cache');
 *   const cache = new TTLCache(30); // 30 minute TTL
 *   
 *   cache.set('key', value);
 *   const value = cache.get('key');
 *   cache.clear('key');
 *   cache.clear(); // Clear all
 */

class TTLCache {
  /**
   * Initialize cache with TTL
   * @param {number} ttlMinutes - Time to live in minutes (default: 30)
   */
  constructor(ttlMinutes = 30) {
    this.store = new Map();
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Get value from cache if valid
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if expired/not found
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  set(key, value) {
    this.store.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache entry or entire cache
   * @param {string} key - Cache key to clear (optional). If not provided, clears all
   */
  clear(key) {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  /**
   * Get current cache size
   * @returns {number} Number of cached entries
   */
  size() {
    return this.store.size;
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and not expired
   */
  has(key) {
    return this.get(key) !== null;
  }
}

module.exports = TTLCache;
