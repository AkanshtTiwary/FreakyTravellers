/**
 * Travel Plan AI Service
 * Calls the configured LLM (Gemini / OpenAI) to generate a travel plan.
 * Falls back to a deterministic template response if the API is unavailable.
 *
 * Supported providers (configure via env):
 *   GEMINI_API_KEY  → Google Gemini 1.5 Flash (recommended, generous free tier)
 *   OPENAI_API_KEY  → OpenAI GPT-4o-mini
 */

const https = require('https');

// ---------------------------------------------------------------------------
// Helper: POST JSON to a URL, returns parsed response body
// ---------------------------------------------------------------------------
function postJSON(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try   { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON response from LLM')); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Gemini call
// ---------------------------------------------------------------------------
async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  const raw = await postJSON(url, payload);
  const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// OpenAI call
// ---------------------------------------------------------------------------
async function callOpenAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  };

  const raw = await postJSON(url, payload, { Authorization: `Bearer ${apiKey}` });
  const text = raw?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Fallback template when no LLM is available
// ---------------------------------------------------------------------------
function buildFallbackPlan({ source, destination, budget, currency, tier, tierEmoji, travelers, allocation }) {
  const cats       = allocation.categories;
  const estimatedDays = Math.min(Math.max(3, Math.floor(budget / 50)), 10);
  const perMeal    = parseFloat((cats.food.perPerson / (estimatedDays * 3)).toFixed(2));

  const itinerary = [];
  for (let d = 1; d <= estimatedDays; d++) {
    itinerary.push({
      day: d,
      title: d === 1 ? `Departure from ${source}` : d === estimatedDays ? `Return journey to ${source}` : `Explore ${destination} - Day ${d}`,
      morning:   d === 1 ? `Travel from ${source} to ${destination}` : 'Morning exploration of local attractions',
      afternoon: 'Sightseeing and local experiences',
      evening:   'Local food and rest',
      estimatedDailyCost: parseFloat(((budget - cats.transport.allocated) / estimatedDays).toFixed(2)),
    });
  }

  return {
    _disclaimer: 'AI service unavailable — this is a template estimate. Prices are approximate.',
    tripSummary: {
      source, destination,
      totalBudget: budget,
      currency,
      tier,
      tierEmoji,
      travelers,
      estimatedDays,
    },
    budgetBreakdown: {
      transport:     { allocated: cats.transport.allocated,     spent: cats.transport.allocated,     items: [{ name: 'Estimated transport', cost: cats.transport.allocated, note: cats.transport.hint }] },
      accommodation: { allocated: cats.accommodation.allocated, spent: cats.accommodation.allocated, items: [{ name: 'Estimated accommodation', cost: cats.accommodation.allocated, note: cats.accommodation.hint }] },
      food:          { allocated: cats.food.allocated,          spent: cats.food.allocated,          items: [{ name: 'Estimated meals', cost: cats.food.allocated, note: cats.food.hint }] },
      activities:    { allocated: cats.activities.allocated,    spent: cats.activities.allocated,    items: [{ name: 'Estimated activities', cost: cats.activities.allocated, note: cats.activities.hint }] },
    },
    itinerary,
    transportOptions: [
      { mode: 'Bus / Shared transport', operator: 'Local operator', duration: 'Varies', cost: cats.transport.allocated * 0.6, costUnit: 'total', bookingTip: 'Book in advance for best rates' },
      { mode: 'Train',                  operator: 'National rail',  duration: 'Varies', cost: cats.transport.allocated * 0.8, costUnit: 'total', bookingTip: 'Check for concession fares' },
    ],
    accommodationOptions: [
      { type: 'Budget option', name: 'Local guesthouse / hostel', pricePerNight: parseFloat((cats.accommodation.perPerson / estimatedDays).toFixed(2)), currency, area: destination, tip: cats.accommodation.hint },
    ],
    foodGuide: {
      budgetPerMeal: perMeal,
      currency,
      recommendations: [
        { type: 'Street food',      avgCost: parseFloat((perMeal * 0.4).toFixed(2)), examples: 'Local snacks, roadside stalls' },
        { type: 'Local restaurant', avgCost: perMeal,                                examples: 'Set meal, thali, noodle bowl' },
      ],
      localSpecialties: ['Ask locals for best street-food spots'],
    },
    budgetTips: {
      canSaveBy:  { percentage: 20, suggestions: ['Travel off-peak', 'Use public transport', 'Cook your own meals where possible'] },
      upgradeFor: { additionalAmount: parseFloat((budget * 0.3).toFixed(2)), currency, unlocks: ['More comfortable accommodation', 'Better transport options', 'Premium experiences'] },
    },
    minimumFareOption: {
      totalMinimumCost: parseFloat((cats.transport.allocated * 0.5 + cats.accommodation.allocated * 0.4 + cats.food.allocated * 0.5 + cats.activities.allocated * 0.3).toFixed(2)),
      currency,
      breakdown: {
        transport:     parseFloat((cats.transport.allocated     * 0.5).toFixed(2)),
        accommodation: parseFloat((cats.accommodation.allocated * 0.4).toFixed(2)),
        food:          parseFloat((cats.food.allocated          * 0.5).toFixed(2)),
        activities:    parseFloat((cats.activities.allocated    * 0.3).toFixed(2)),
      },
      description: 'Absolute cheapest: overnight bus/train, free camping or couchsurfing, street food only, free attractions.',
    },
    warnings: [
      '⚠️ This is a template estimate — AI service is currently unavailable.',
      '⚠️ Prices are approximate and may vary significantly.',
    ],
    proTips: [
      'Always carry some local cash for small vendors.',
      'Book transport and accommodation in advance during peak seasons.',
    ],
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
/**
 * Generate a travel plan using the best available LLM.
 * Falls back to template if no API key is configured or call fails.
 *
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {string} params.userPrompt
 * @param {object} params.fallbackContext  - passed to buildFallbackPlan on failure
 * @returns {Promise<{ plan: object, source: 'gemini'|'openai'|'fallback' }>}
 */
async function generateTravelPlan({ systemPrompt, userPrompt, fallbackContext }) {
  // Try Gemini first (generous free tier)
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('🤖 Calling Gemini API...');
      const plan = await callGemini(systemPrompt, userPrompt);
      console.log('✅ Gemini response received');
      return { plan, source: 'gemini' };
    } catch (err) {
      console.warn('⚠️ Gemini failed, trying OpenAI:', err.message);
    }
  }

  // Try OpenAI as secondary
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('🤖 Calling OpenAI API...');
      const plan = await callOpenAI(systemPrompt, userPrompt);
      console.log('✅ OpenAI response received');
      return { plan, source: 'openai' };
    } catch (err) {
      console.warn('⚠️ OpenAI also failed:', err.message);
    }
  }

  // Graceful fallback
  console.warn('⚠️ No LLM available — returning template travel plan');
  return {
    plan: buildFallbackPlan(fallbackContext),
    source: 'fallback',
  };
}

module.exports = { generateTravelPlan };
