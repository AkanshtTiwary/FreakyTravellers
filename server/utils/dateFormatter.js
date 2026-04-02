/**
 * Date and Time Formatting Utilities
 * Shared formatting functions for travel components
 */

/**
 * Format time string from decimal to HH:MM format
 * @param {string|number} timeStr - Time in format like "12.40" or "12:40"
 * @returns {string|null} Formatted time "12:40" or null if invalid
 */
const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return String(timeStr).replace('.', ':');
};

/**
 * Format duration from decimal hours to human-readable format
 * @param {string|number} durationStr - Duration in format like "16.52" (16 hours, 52 minutes)
 * @returns {string|null} Formatted duration "16h 52m" or original string if format not recognized
 */
const formatDuration = (durationStr) => {
  if (!durationStr) return null;
  const timeStr = String(durationStr).trim();
  const parts = timeStr.split('.');
  
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const decimalMinutes = parseInt(parts[1], 10);
    // Convert decimal part to minutes (0-59 range)
    const minutes = Math.round((decimalMinutes / 100) * 60);
    return `${hours}h ${minutes}m`;
  }
  
  return timeStr; // Return as-is if format not recognized
};

module.exports = {
  formatTime,
  formatDuration,
};
