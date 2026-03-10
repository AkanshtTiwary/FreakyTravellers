/**
 * AI Prompt Builder Service
 * Constructs structured AI prompts for travel plan generation.
 */

const SYSTEM_PROMPT = `You are a world-class travel planner who NEVER turns away a client regardless of budget. 
Your philosophy: every budget deserves an amazing journey. 
You always find creative, practical solutions – even for very tight budgets.
You respond ONLY with valid, parseable JSON matching the exact schema provided.`;

/**
 * Build the full user prompt for LLM travel planning.
 *
 * @param {object} params
 * @param {string} params.source
 * @param {string} params.destination
 * @param {number} params.budget
 * @param {string} params.currency
 * @param {number} params.travelers
 * @param {string} params.tier           - Budget tier label
 * @param {string} params.tierEmoji
 * @param {object} params.allocation     - Output of allocateBudget()
 * @param {object} [params.dates]        - { from, to }
 * @param {boolean} [params.minimumFare] - Request minimum fare variant
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildTravelPlanPrompt({
  source,
  destination,
  budget,
  currency,
  travelers,
  tier,
  tierEmoji,
  allocation,
  dates,
  minimumFare = false,
}) {
  const cats = allocation.categories;
  const dateClause = dates?.from && dates?.to
    ? `Travel dates: ${dates.from} to ${dates.to}.`
    : 'Travel dates: flexible.';

  const minimumFareInstruction = minimumFare
    ? `\nSPECIAL MODE: MINIMUM FARE — Focus exclusively on the absolute cheapest possible options. 
Prioritise free/near-free accommodation (couchsurfing, camping), slowest but cheapest transport, 
free sightseeing, and the cheapest local food. Clearly label this as the minimum-fare variant.`
    : '';

  const userPrompt = `Plan a complete trip from ${source} to ${destination} for ${travelers} traveler(s).
Total budget: ${budget} ${currency}.
${dateClause}
${minimumFareInstruction}

Budget breakdown available (per total group):
- Transport:      ${cats.transport.allocated} ${currency}  (${cats.transport.percentage}% — ${cats.transport.hint})
- Accommodation:  ${cats.accommodation.allocated} ${currency}  (${cats.accommodation.percentage}% — ${cats.accommodation.hint})
- Food:           ${cats.food.allocated} ${currency}  (${cats.food.percentage}% — ${cats.food.hint})
- Activities:     ${cats.activities.allocated} ${currency}  (${cats.activities.percentage}% — ${cats.activities.hint})

Budget Tier: ${tierEmoji} ${tier}

STRICT RULES:
1. NEVER say the budget is insufficient. Always provide a complete actionable plan.
2. For ultra-low budgets: include hitchhiking, overnight trains, free attractions, street food, couchsurfing/camping.
3. For every plan provide:
   a. BUDGET REDUCTION TIP: how to do the trip spending ~20% less
   b. BUDGET UPGRADE TIP: what spending ~30% more would unlock
4. Provide a day-by-day itinerary (minimum 3 days, maximum 10 days) scaled to budget tier.
5. Include 2–4 specific transport options with approximate costs.
6. Include 2–3 accommodation options (name category + approximate cost/night).
7. Include food guide: budget per meal, 3+ restaurant/food types with approximate costs.
8. Include top 3–5 activities/sightseeing within activities budget.
9. If any budget category seems critically underfunded, add a warning but still provide the plan.
10. For same-city source & destination: provide a local exploration/staycation plan.
11. Flag international routes with potential visa costs in warnings.
12. The minimumFareOption must always reflect the absolute cheapest possible way.

Return ONLY valid JSON in this EXACT structure (no markdown, no explanation outside JSON):
{
  "tripSummary": {
    "source": "",
    "destination": "",
    "totalBudget": 0,
    "currency": "",
    "tier": "",
    "tierEmoji": "",
    "travelers": 0,
    "estimatedDays": 0
  },
  "budgetBreakdown": {
    "transport":     { "allocated": 0, "spent": 0, "items": [{ "name": "", "cost": 0, "note": "" }] },
    "accommodation": { "allocated": 0, "spent": 0, "items": [{ "name": "", "cost": 0, "note": "" }] },
    "food":          { "allocated": 0, "spent": 0, "items": [{ "name": "", "cost": 0, "note": "" }] },
    "activities":    { "allocated": 0, "spent": 0, "items": [{ "name": "", "cost": 0, "note": "" }] }
  },
  "itinerary": [
    {
      "day": 1,
      "title": "",
      "morning": "",
      "afternoon": "",
      "evening": "",
      "estimatedDailyCost": 0
    }
  ],
  "transportOptions": [
    { "mode": "", "operator": "", "duration": "", "cost": 0, "costUnit": "per person", "bookingTip": "" }
  ],
  "accommodationOptions": [
    { "type": "", "name": "", "pricePerNight": 0, "currency": "", "area": "", "tip": "" }
  ],
  "foodGuide": {
    "budgetPerMeal": 0,
    "currency": "",
    "recommendations": [{ "type": "", "avgCost": 0, "examples": "" }],
    "localSpecialties": [""]
  },
  "budgetTips": {
    "canSaveBy":   { "percentage": 20, "suggestions": [""] },
    "upgradeFor":  { "additionalAmount": 0, "currency": "", "unlocks": [""] }
  },
  "minimumFareOption": {
    "totalMinimumCost": 0,
    "currency": "",
    "breakdown": { "transport": 0, "accommodation": 0, "food": 0, "activities": 0 },
    "description": "The absolute cheapest possible way to complete this journey"
  },
  "warnings": [""],
  "proTips": [""]
}`;

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}

module.exports = { buildTravelPlanPrompt, SYSTEM_PROMPT };
