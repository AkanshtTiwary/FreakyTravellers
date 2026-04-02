/**
 * Transport Selection Service
 * Centralized logic for selecting transport based on budget tier and preferences
 * Used across multiple controllers and services for consistency
 */

const logger = require('../utils/logger');

/**
 * Select most affordable transport option based on budget tier
 * @param {Array} transportOptions - Array of transport options with pricing
 * @param {number} totalBudget - Total available budget
 * @param {string} travelClass - Travel class ('premium', 'comfort', 'budget')
 * @param {number} numberOfTravelers - Number of travelers
 * @returns {Object} Selected transport option or fallback option
 */
const selectAffordableTransport = (
  transportOptions = [],
  totalBudget,
  travelClass = 'comfort',
  numberOfTravelers = 1
) => {
  // Budget allocation threshold by travel class
  const budgetThresholds = {
    premium: 0.50,   // Use 50% of budget for premium transport
    comfort: 0.60,   // Use 60% of budget for comfort transport
    budget: 0.70,    // Use 70% of budget for budget transport
  };

  const threshold = budgetThresholds[travelClass] || budgetThresholds.comfort;
  const maxTransportCostPerPerson = (totalBudget * threshold) / numberOfTravelers;

  logger.debug(
    `Selecting transport: class=${travelClass}, max_cost_person=₹${maxTransportCostPerPerson}`
  );

  // Filter affordable options and sort by cost (ascending)
  const affordableOptions = transportOptions
    .filter((option) => {
      const cost = option.totalCost || option.costForGroup || option.price || 0;
      return cost <= maxTransportCostPerPerson;
    })
    .sort((a, b) => {
      const costA = a.totalCost || a.costForGroup || a.price || 0;
      const costB = b.totalCost || b.costForGroup || b.price || 0;
      return costA - costB;
    });

  // Return cheapest affordable option, or fallback to cheapest overall
  if (affordableOptions.length > 0) {
    logger.debug(`Found ${affordableOptions.length} affordable options`);
    return affordableOptions[0];
  }

  logger.warn(`No affordable options found for class=${travelClass}, using cheapest option`);
  const cheapest = transportOptions.sort((a, b) => {
    const costA = a.totalCost || a.costForGroup || a.price || 0;
    const costB = b.totalCost || b.costForGroup || b.price || 0;
    return costA - costB;
  })[0];

  return cheapest || null;
};

/**
 * Select transport by priority criteria
 * @param {Array} options - Array of transport options
 * @param {Object} criteria - Selection criteria {priority: 'cost|speed|comfort', maxCost, numberOfTravelers}
 * @returns {Object} Selected transport option
 */
const selectTransportByPriority = (options = [], criteria = {}) => {
  const { priority = 'cost', maxCost = Infinity, numberOfTravelers = 1 } = criteria;

  const validOptions = options.filter(
    (option) => (option.totalCost || option.price || 0) <= maxCost
  );

  if (validOptions.length === 0) {
    return options[0] || null;
  }

  switch (priority) {
    case 'speed':
      // Sort by duration (ascending)
      return validOptions.sort((a, b) => {
        const durationA = parseInt(a.duration) || 999;
        const durationB = parseInt(b.duration) || 999;
        return durationA - durationB;
      })[0];

    case 'comfort':
      // Prioritize flights, then trains, then buses
      const typeOrder = { flight: 0, train: 1, bus: 2, auto: 3, walk: 4 };
      return validOptions.sort((a, b) => {
        const orderA = typeOrder[a.type || a.mode] || 999;
        const orderB = typeOrder[b.type || b.mode] || 999;
        return orderA - orderB;
      })[0];

    case 'cost':
    default:
      // Sort by cost (ascending)
      return validOptions.sort((a, b) => {
        const costA = a.totalCost || a.costForGroup || a.price || 0;
        const costB = b.totalCost || b.costForGroup || b.price || 0;
        return costA - costB;
      })[0];
  }
};

module.exports = {
  selectAffordableTransport,
  selectTransportByPriority,
};
