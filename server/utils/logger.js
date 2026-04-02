/**
 * Centralized Logging Utility
 * Provides structured logging with environment-based verbosity control
 * 
 * Usage:
 *   const logger = require('./logger');
 *   logger.debug('Debug message');
 *   logger.info('Info message');
 *   logger.warn('Warning message');
 *   logger.error('Error message');
 * 
 * Environment Variables:
 *   DEBUG=true  - Enable debug logs (default: false)
 */

const logger = {
  /**
   * Debug logs - only shown when DEBUG=true
   * @param {string} msg - Message to log
   */
  debug: (msg) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[DEBUG] ${msg}`);
    }
  },

  /**
   * Info logs - always shown in production
   * @param {string} msg - Message to log
   */
  info: (msg) => {
    console.log(`[INFO] ${msg}`);
  },

  /**
   * Warning logs
   * @param {string} msg - Message to log
   */
  warn: (msg) => {
    console.warn(`[WARN] ${msg}`);
  },

  /**
   * Error logs
   * @param {string} msg - Message to log
   */
  error: (msg) => {
    console.error(`[ERROR] ${msg}`);
  },
};

module.exports = logger;
