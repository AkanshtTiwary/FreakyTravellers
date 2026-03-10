/**
 * Budget Formatter Utility
 * Currency and budget display helpers for the Travel Planner UI
 */

/**
 * Format a number as a currency string.
 * @param {number} amount
 * @param {string} currency - ISO 4217 code, e.g. 'USD', 'INR'
 * @param {object} [options]
 * @param {boolean} [options.compact=false]  - Use compact notation (1K, 1M)
 * @param {number}  [options.decimals=0]     - Decimal places
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'USD', { compact = false, decimals = 0 } = {}) {
  if (amount == null || isNaN(amount)) return '—';

  try {
    const notation = compact ? 'compact' : 'standard';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      notation,
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Fallback for unknown currencies
    return `${currency} ${Number(amount).toFixed(decimals)}`;
  }
}

/**
 * Format a percentage for display.
 * @param {number} value - 0-100
 * @returns {string}
 */
export function formatPercentage(value) {
  return `${Math.round(value)}%`;
}

/**
 * Return a Tailwind colour class for each budget category.
 * @param {'transport'|'accommodation'|'food'|'activities'} category
 * @returns {string}
 */
export function getCategoryColor(category) {
  const map = {
    transport:     '#6366f1', // indigo
    accommodation: '#f59e0b', // amber
    food:          '#10b981', // emerald
    activities:    '#ec4899', // pink
  };
  return map[category] ?? '#6b7280';
}

/**
 * Return a human-readable label for a budget category.
 */
export function getCategoryLabel(category) {
  const map = {
    transport:     '✈️  Transport',
    accommodation: '🏨 Accommodation',
    food:          '🍽️  Food',
    activities:    '🎭 Activities',
  };
  return map[category] ?? category;
}

/**
 * Map tier key to display label + colour.
 */
export const TIER_META = {
  shoestring: { label: 'Shoestring Traveler',  emoji: '🎒', color: '#6b7280', bg: 'bg-gray-100',   text: 'text-gray-700'   },
  budget:     { label: 'Budget Traveler',       emoji: '💵', color: '#3b82f6', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  medium:     { label: 'Smart Traveler',        emoji: '✈️',  color: '#10b981', bg: 'bg-emerald-100',text: 'text-emerald-700' },
  comfort:    { label: 'Comfort Traveler',      emoji: '🛋️',  color: '#f59e0b', bg: 'bg-amber-100',  text: 'text-amber-700'  },
  luxury:     { label: 'Premium Experience',    emoji: '💎', color: '#8b5cf6', bg: 'bg-purple-100', text: 'text-purple-700' },
};
