/**
 * Budget Allocator Service
 * Splits a total budget into 4 travel categories based on tier.
 *
 * TODO: Replace AI estimates with localFareDB.lookup(source, destination)
 *       when local fare database is available.
 */

/**
 * Allocation percentages per tier.
 * Adjust these to change how money is distributed across categories.
 */
const BUDGET_ALLOCATION = {
  shoestring: { transport: 0.50, accommodation: 0.20, food: 0.15, activities: 0.15 },
  budget:     { transport: 0.40, accommodation: 0.25, food: 0.20, activities: 0.15 },
  medium:     { transport: 0.35, accommodation: 0.30, food: 0.20, activities: 0.15 },
  comfort:    { transport: 0.30, accommodation: 0.35, food: 0.20, activities: 0.15 },
  luxury:     { transport: 0.25, accommodation: 0.40, food: 0.20, activities: 0.15 },
};

/**
 * Generic recommendations per category per tier.
 * The AI prompt will add route-specific details on top of these.
 */
const TIER_HINTS = {
  shoestring: {
    transport:     'Overnight trains/buses, hitchhiking, carpooling apps',
    accommodation: 'Couchsurfing, free camping, dorm hostels',
    food:          'Street food, local dhabas, self-cooked meals',
    activities:    'Free attractions, nature walks, public beaches, temples',
  },
  budget: {
    transport:     'Sleeper class train, budget buses, budget airlines (no frills)',
    accommodation: '6-12 bed dormitory hostels, budget guesthouses',
    food:          'Local restaurants, thali meals, budget cafes',
    activities:    'Entry-level guided tours, popular landmarks, free museums',
  },
  medium: {
    transport:     'Economy flights, 2AC/3AC trains, intercity buses',
    accommodation: '2–3 star hotels, well-rated guesthouses',
    food:          'Mid-range restaurants, some casual dining',
    activities:    'Popular attractions, half-day tours, city day-passes',
  },
  comfort: {
    transport:     'Business class flights, first-class trains, private transfers',
    accommodation: '4-star hotels, boutique stays',
    food:          'Good restaurants, rooftop dining, curated experiences',
    activities:    'Private guided tours, premium experiences, spa visits',
  },
  luxury: {
    transport:     'Private jets / chartered flights, luxury trains, chauffeur transfers',
    accommodation: '5-star hotels, heritage palaces, private villas',
    food:          'Fine dining, chef\'s tasting menus, food & wine experiences',
    activities:    'Exclusive private tours, helicopter rides, bespoke experiences',
  },
};

/**
 * Allocate a budget into the 4 travel categories.
 *
 * @param {object} params
 * @param {number} params.totalBudget   - Total budget in user's currency
 * @param {string} params.currency      - ISO 4217 currency code
 * @param {string} params.tier          - Budget tier from classifyBudget()
 * @param {number} [params.travelers=1] - Number of travelers
 * @returns {object} Allocation breakdown with amounts + hints
 */
function allocateBudget({ totalBudget, currency = 'USD', tier = 'medium', travelers = 1 }) {
  const ratios     = BUDGET_ALLOCATION[tier] ?? BUDGET_ALLOCATION.medium;
  const hints      = TIER_HINTS[tier]        ?? TIER_HINTS.medium;
  const perPerson  = totalBudget / Math.max(travelers, 1);

  const result = {};
  const categories = ['transport', 'accommodation', 'food', 'activities'];

  for (const cat of categories) {
    const allocated = parseFloat((totalBudget * ratios[cat]).toFixed(2));
    const perPersonAlloc = parseFloat((perPerson * ratios[cat]).toFixed(2));
    result[cat] = {
      allocated,            // total for the entire group
      perPerson: perPersonAlloc,
      percentage: Math.round(ratios[cat] * 100),
      currency,
      hint: hints[cat],
    };
  }

  return {
    total: totalBudget,
    currency,
    tier,
    travelers,
    categories: result,
  };
}

module.exports = { allocateBudget, BUDGET_ALLOCATION, TIER_HINTS };
