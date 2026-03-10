/**
 * Budget Classifier Service
 * Classifies a given budget into a travel tier relative to the source→destination route.
 *
 * Tiers (relative to route cost baseline):
 *   shoestring  < 25% of baseline
 *   budget      25% – 75%
 *   medium      75% – 150%
 *   comfort     150% – 300%
 *   luxury      > 300%
 */

/**
 * Rough per-person route baseline costs in USD.
 * These are AI-estimated averages for a 1-week trip (transport + budget stay + food).
 * TODO: Replace AI estimates with localFareDB.lookup(source, destination)
 *       when local fare database is available.
 */
const ROUTE_BASELINES = {
  // Domestic India routes (approximate INR → USD at 83)
  'delhi-goa':        400,
  'delhi-mumbai':     300,
  'delhi-pune':       280,
  'delhi-bangalore':  350,
  'delhi-hyderabad':  320,
  'mumbai-goa':       250,
  'mumbai-bangalore': 280,
  // International
  'india-usa':        1500,
  'india-uk':         1400,
  'india-dubai':      600,
  'india-singapore':  700,
  'india-thailand':   550,
  // Default fallback
  default: 500,
};

/**
 * Tier thresholds as ratio of budget / baseline
 */
const TIER_THRESHOLDS = [
  { tier: 'shoestring', maxRatio: 0.30, label: 'Shoestring Traveler',  emoji: '🎒' },
  { tier: 'budget',     maxRatio: 0.75, label: 'Budget Traveler',      emoji: '💵' },
  { tier: 'medium',     maxRatio: 1.50, label: 'Smart Traveler',       emoji: '✈️'  },
  { tier: 'comfort',    maxRatio: 3.00, label: 'Comfort Traveler',     emoji: '🛋️'  },
  { tier: 'luxury',     maxRatio: Infinity, label: 'Premium Experience', emoji: '💎' },
];

/**
 * Exchange rates to USD (approximate, for internal tier classification only).
 * TODO: Replace with live exchange-rate API when available.
 */
const EXCHANGE_RATES_TO_USD = {
  USD: 1,
  INR: 1 / 83,
  EUR: 1.08,
  GBP: 1.27,
  AED: 0.27,
  SGD: 0.74,
  THB: 0.028,
  JPY: 0.0067,
  AUD: 0.65,
  CAD: 0.74,
};

/**
 * Normalise budget to USD for tier classification.
 * @param {number} amount
 * @param {string} currency - ISO 4217 code
 * @returns {number} amount in USD
 */
function normalizeToUSD(amount, currency = 'USD') {
  const rate = EXCHANGE_RATES_TO_USD[currency.toUpperCase()] ?? 1;
  return amount * rate;
}

/**
 * Get a route baseline in USD.
 * Tries both orderings of the city pair.
 * @param {string} source
 * @param {string} destination
 * @returns {number} baseline cost in USD
 */
function getRouteBaseline(source, destination) {
  const clean = (s) => s.trim().toLowerCase().replace(/\s+/g, '-');
  const key1 = `${clean(source)}-${clean(destination)}`;
  const key2 = `${clean(destination)}-${clean(source)}`;
  return ROUTE_BASELINES[key1] ?? ROUTE_BASELINES[key2] ?? ROUTE_BASELINES.default;
}

/**
 * Classify a budget into a tier.
 * @param {object} params
 * @param {string} params.source
 * @param {string} params.destination
 * @param {number} params.budget
 * @param {string} params.currency
 * @param {number} [params.travelers=1]
 * @returns {{ tier, label, emoji, ratio, baselineUSD, budgetUSD }}
 */
function classifyBudget({ source, destination, budget, currency = 'USD', travelers = 1 }) {
  const budgetUSD   = normalizeToUSD(budget, currency);
  const perPersonUSD = budgetUSD / Math.max(travelers, 1);
  const baselineUSD = getRouteBaseline(source, destination);
  const ratio       = perPersonUSD / baselineUSD;

  const match = TIER_THRESHOLDS.find((t) => ratio <= t.maxRatio);
  const result = match || TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];

  return {
    tier: result.tier,
    label: result.label,
    emoji: result.emoji,
    ratio: parseFloat(ratio.toFixed(2)),
    baselineUSD,
    budgetUSD: parseFloat(budgetUSD.toFixed(2)),
    perPersonUSD: parseFloat(perPersonUSD.toFixed(2)),
  };
}

module.exports = { classifyBudget, normalizeToUSD, EXCHANGE_RATES_TO_USD };
