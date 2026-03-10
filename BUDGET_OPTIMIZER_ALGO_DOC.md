# Budget Optimizer Algorithm — Technical Documentation

> **System:** Budget-Adaptive Travel Intelligence System  
> **Author:** SmartBudgetTrip Engineering  
> **Last Updated:** March 2026  
> **Codebase:** `/server/services/` + `/client/src/`

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Stage 1 — Budget Classification](#3-stage-1--budget-classification)
4. [Stage 2 — Budget Allocation](#4-stage-2--budget-allocation)
5. [Stage 3 — AI Prompt Construction](#5-stage-3--ai-prompt-construction)
6. [Stage 4 — LLM Execution & Fallback](#6-stage-4--llm-execution--fallback)
7. [Stage 5 — Persistence Layer](#7-stage-5--persistence-layer)
8. [API Contract](#8-api-contract)
9. [Frontend Data Flow](#9-frontend-data-flow)
10. [Edge Case Handling](#10-edge-case-handling)
11. [Configuration & Extensibility](#11-configuration--extensibility)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. Overview

The Budget Optimizer is a **5-stage pipeline** that transforms a raw user input
(`source`, `destination`, `budget`) into a fully structured, actionable travel
plan — regardless of how large or small the budget is.

```
User Input
   │
   ▼
[Stage 1] Budget Classifier  →  assigns a tier (shoestring … luxury)
   │
   ▼
[Stage 2] Budget Allocator   →  splits budget into 4 categories
   │
   ▼
[Stage 3] Prompt Builder     →  constructs an LLM-ready prompt
   │
   ▼
[Stage 4] AI Executor        →  calls Gemini / OpenAI / fallback template
   │
   ▼
[Stage 5] Persistence        →  saves to MongoDB, returns JSON to client
```

The core design principle: **no budget is ever rejected**. The system scales
its recommendations up or down intelligently, from hitchhiking for $1 trips to
private jets for $1,000,000 trips.

---

## 2. System Architecture

```
server/
├── services/
│   ├── budgetClassifier.service.js   ← Stage 1
│   ├── budgetAllocator.service.js    ← Stage 2
│   ├── aiPromptBuilder.service.js    ← Stage 3
│   └── travelPlanAI.service.js       ← Stage 4
├── models/
│   └── TravelPlan.js                 ← Stage 5 (Mongoose schema)
├── controllers/
│   └── travelPlan.controller.js      ← Orchestrates all stages
└── routes/
    └── travelPlan.routes.js          ← HTTP layer

client/
├── store/
│   └── travelPlanStore.js            ← Zustand state + API calls
├── components/travel/
│   ├── TravelPlannerForm.jsx         ← User input
│   ├── TravelPlanResult.jsx          ← Full plan display
│   ├── BudgetBreakdownChart.jsx      ← Recharts donut chart
│   ├── ItineraryCard.jsx             ← Per-day collapsible card
│   └── MinimumFarePanel.jsx          ← Cheapest-option panel
└── utils/
    └── budgetFormatter.js            ← Currency + label helpers
```

---

## 3. Stage 1 — Budget Classification

**File:** `server/services/budgetClassifier.service.js`

### Goal
Determine how "big" the user's budget is — not in absolute terms, but **relative
to what this specific route actually costs**. $100 is lavish for a 5 km city
tour but destitute for a Delhi→New York flight.

### Algorithm

```
budgetUSD = budget × exchangeRate(currency → USD)
perPersonUSD = budgetUSD ÷ travelers
baselineUSD  = getRouteBaseline(source, destination)   // look-up table
ratio        = perPersonUSD ÷ baselineUSD
tier         = thresholdTable[ratio]
```

### Tier Threshold Table

| Ratio (perPerson / baseline) | Tier       | Label              | Emoji |
|------------------------------|------------|--------------------|-------|
| < 0.30                       | shoestring | Shoestring Traveler | 🎒   |
| 0.30 – 0.75                  | budget     | Budget Traveler    | 💵   |
| 0.75 – 1.50                  | medium     | Smart Traveler     | ✈️   |
| 1.50 – 3.00                  | comfort    | Comfort Traveler   | 🛋️   |
| > 3.00                       | luxury     | Premium Experience | 💎   |

### Route Baseline Table (excerpt)

```javascript
const ROUTE_BASELINES = {
  'delhi-goa':        400,  // USD, 1-week per-person estimate
  'delhi-mumbai':     300,
  'mumbai-bangalore': 280,
  'india-usa':       1500,
  'india-dubai':      600,
  default:            500,  // fallback for unknown routes
};
```

> **Important:** These are AI-estimated averages for a typical 1-week trip
> (transport + accommodation + food). They are the **denominator** for tier
> classification only — not shown to the user.

### Currency Normalisation

The classifier maintains a static exchange rate table (`EXCHANGE_RATES_TO_USD`)
to normalise any input currency to USD for classification. User-facing output
always uses the **original** currency.

```
INR: 1/83 ≈ 0.012    EUR: 1.08    GBP: 1.27    AED: 0.27
```

> **TODO:** Replace static rates with a live exchange-rate API when available.

### Output Shape

```javascript
{
  tier:         'shoestring',
  label:        'Shoestring Traveler',
  emoji:        '🎒',
  ratio:        0.30,          // perPersonUSD / baselineUSD
  baselineUSD:  400,
  budgetUSD:    120.48,
  perPersonUSD: 120.48
}
```

---

## 4. Stage 2 — Budget Allocation

**File:** `server/services/budgetAllocator.service.js`

### Goal
Split the total budget into four spending categories, with weights that make
sense for the tier. A shoestring traveller spends more proportionally on getting
there; a luxury traveller spends more on accommodation.

### Allocation Matrix

```javascript
const BUDGET_ALLOCATION = {
  //           transport  accommodation  food   activities
  shoestring: [ 0.50,      0.20,         0.15,  0.15 ],
  budget:     [ 0.40,      0.25,         0.20,  0.15 ],
  medium:     [ 0.35,      0.30,         0.20,  0.15 ],
  comfort:    [ 0.30,      0.35,         0.20,  0.15 ],
  luxury:     [ 0.25,      0.40,         0.20,  0.15 ],
};
```

### Calculation

```
allocatedAmount(cat) = totalBudget × allocationRatio(tier, cat)
perPersonAmount(cat) = perPersonBudget × allocationRatio(tier, cat)
```

### Tier Hints (per category)

Each allocation also carries a human-readable hint that becomes part of the AI
prompt, steering recommendations toward appropriate options:

| Tier       | Transport                      | Accommodation               |
|------------|--------------------------------|-----------------------------|
| shoestring | Overnight trains, hitchhiking  | Couchsurfing, camping       |
| budget     | Sleeper trains, budget buses   | 6-12 bed dorm hostels        |
| medium     | Economy flights, 2AC trains    | 2–3 star hotels             |
| comfort    | Business class, private xfers  | 4-star hotels, boutique      |
| luxury     | Private jets, chartered flights| 5-star, heritage palaces    |

### Output Shape

```javascript
{
  total:     100,
  currency: 'USD',
  tier:     'shoestring',
  travelers: 1,
  categories: {
    transport:     { allocated: 50, perPerson: 50, percentage: 50, hint: '...' },
    accommodation: { allocated: 20, perPerson: 20, percentage: 20, hint: '...' },
    food:          { allocated: 15, perPerson: 15, percentage: 15, hint: '...' },
    activities:    { allocated: 15, perPerson: 15, percentage: 15, hint: '...' },
  }
}
```

---

## 5. Stage 3 — AI Prompt Construction

**File:** `server/services/aiPromptBuilder.service.js`

### Goal
Assemble a deterministic, structured prompt that gives the LLM everything it
needs to produce a **consistent JSON output** — without hallucinating numbers,
refusing the task, or producing unstructured text.

### Two-Part Prompt Design

**System prompt** — sets the AI persona and strict output constraint:
```
"You are a world-class travel planner who NEVER turns away a client
regardless of budget. You respond ONLY with valid, parseable JSON."
```

**User prompt** — injects all computed values:
```
Plan a complete trip from {SOURCE} to {DESTINATION} for {N} traveler(s).
Total budget: {BUDGET} {CURRENCY}.

Budget breakdown available (per total group):
- Transport:      {X} USD  (50% — Overnight trains, hitchhiking)
- Accommodation:  {X} USD  (20% — Couchsurfing, camping)
- Food:           {X} USD  (15% — Street food, local dhabas)
- Activities:     {X} USD  (15% — Free attractions, nature walks)

Budget Tier: 🎒 Shoestring Traveler
...
```

### 10 Strict Rules Injected Into Every Prompt

1. Never say budget is insufficient — always return a plan.
2. For ultra-low budgets: include hitchhiking, overnight trains, free attractions.
3. Always include a 20% savings tip and a 30% upgrade tip.
4. Day-by-day itinerary (3–10 days) scaled to tier.
5. 2–4 specific transport options with costs.
6. 2–3 accommodation options with per-night cost.
7. Food guide: budget per meal, 3+ place types, local specialties.
8. 3–5 top activities within the activities budget.
9. Flag critically underfunded categories in `warnings[]`.
10. For same-city routes: return a local exploration / staycation plan.

### JSON Schema Enforcement

The prompt ends with the **exact** JSON schema the LLM must return (including
all field names, types, and nesting). This eliminates schema drift across
different LLMs and model versions.

### Minimum Fare Mode

When `minimumFare: true`, an extra instruction block is appended:
```
SPECIAL MODE: MINIMUM FARE — Focus exclusively on the absolute cheapest
possible options. Prioritise free/near-free accommodation, slowest but
cheapest transport, free sightseeing, and cheapest local food.
```

---

## 6. Stage 4 — LLM Execution & Fallback

**File:** `server/services/travelPlanAI.service.js`

### Provider Priority Chain

```
1. Gemini 1.5 Flash  (if GEMINI_API_KEY set)  ← preferred: generous free tier
2. OpenAI GPT-4o-mini (if OPENAI_API_KEY set) ← secondary
3. Deterministic template                       ← always-available fallback
```

### Gemini Call

```javascript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

{
  contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json'   // ← forces JSON output natively
  }
}
```

The `responseMimeType: 'application/json'` parameter instructs Gemini to only
output valid JSON — no markdown wrapping, no preamble.

### OpenAI Call

```javascript
POST https://api.openai.com/v1/chat/completions

{
  model: 'gpt-4o-mini',
  messages: [{ role: 'system', content: systemPrompt },
             { role: 'user',   content: userPrompt   }],
  response_format: { type: 'json_object' }   // ← JSON mode
}
```

### Fallback Template Algorithm

When no LLM is available, the service builds a deterministic plan from the
allocation data alone:

```
estimatedDays = clamp(floor(budget / 50), 3, 10)
perMeal       = food.perPerson / (estimatedDays × 3)

itinerary:
  day 1          → "Departure from {SOURCE}"
  days 2..n-1    → "Explore {DESTINATION} - Day X"
  day n          → "Return journey to {SOURCE}"

costPerDay = (totalBudget - transport.allocated) / estimatedDays

minimumFareCost = transport×0.5 + accommodation×0.4 + food×0.5 + activities×0.3
```

All amounts are computed from the allocator output, so the template always
stays consistent with the budget breakdown.

### Error Strategy

```
callGemini()  → if fails → callOpenAI()  → if fails → buildFallbackPlan()
```

No error is ever propagated to the HTTP client — the endpoint always returns
HTTP 201 with a valid plan alongside an `aiSource` field indicating which
provider was used (`"gemini"`, `"openai"`, or `"fallback"`).

---

## 7. Stage 5 — Persistence Layer

**File:** `server/models/TravelPlan.js`

### Schema

| Field           | Type    | Notes                                     |
|-----------------|---------|-------------------------------------------|
| `userId`        | ObjectId| References `User`; nullable for guests    |
| `source`        | String  | Required                                  |
| `destination`   | String  | Required                                  |
| `budget`        | Number  | min: 1                                    |
| `currency`      | String  | uppercase ISO 4217                         |
| `travelers`     | Number  | 1–50                                      |
| `dates`         | Object  | `{ from, to }` — optional                |
| `budgetTier`    | String  | enum of 5 tiers                           |
| `budgetTierLabel`| String | Human-readable label                      |
| `generatedPlan` | Mixed   | Full AI JSON blob                         |
| `aiSource`      | String  | `gemini` / `openai` / `fallback`          |
| `isMinimumFare` | Boolean | Differentiates min-fare variant           |
| `isSaved`       | Boolean | User explicitly saved the plan            |
| `createdAt`     | Date    | Auto-set                                  |

### Indexes

```javascript
{ userId: 1, createdAt: -1 }   // fast history queries sorted newest first
{ isSaved: 1, userId: 1 }      // fast saved-plan lookups
```

---

## 8. API Contract

**Base path:** `/api/travel`  
**Rate limiter:** `searchLimiter` — 30 requests / 10 min per IP

### POST `/api/travel/plan`

Generate a full budget-adaptive travel plan.

**Request**
```json
{
  "source":      "Delhi",
  "destination": "Goa",
  "budget":      100,
  "currency":    "USD",
  "travelers":   1,
  "dates": { "from": "2026-04-01", "to": "2026-04-07" }
}
```

**Response (201)**
```json
{
  "success":     true,
  "disclaimer":  "⚠️ Prices are AI-estimated…",
  "planId":      "...",
  "aiSource":    "gemini",
  "classification": {
    "tier":        "shoestring",
    "label":       "Shoestring Traveler",
    "emoji":       "🎒",
    "ratio":       0.25,
    "baselineUSD": 400
  },
  "plan": { ... }
}
```

---

### POST `/api/travel/minimum-fare`

Same request body. Returns cheapest possible plan variant.

---

### GET `/api/travel/history` 🔒

Returns paginated list of the logged-in user's plans (large `generatedPlan`
field excluded from list view).

**Query params:** `page` (default 1), `limit` (default 10)

---

### POST `/api/travel/save/:planId` 🔒

Marks a plan as saved to the user's profile.

---

### DELETE `/api/travel/plan/:planId` 🔒

Permanently deletes a saved plan.

---

### Validation Rules

| Field       | Rule                                     |
|-------------|------------------------------------------|
| source      | required, max 100 chars                  |
| destination | required, max 100 chars                  |
| budget      | required, float ≥ 1                      |
| currency    | optional, 3–5 char ISO code             |
| travelers   | optional, integer 1–50                  |
| dates.from  | optional, ISO 8601 date string          |
| dates.to    | optional, ISO 8601 date string          |

---

## 9. Frontend Data Flow

```
User fills TravelPlannerForm
        │
        ▼
   useTravelPlanStore.generatePlan(formData)
        │  POST /api/travel/plan
        ▼
   Zustand stores response in currentPlan
        │
        ▼
   TravelPlanResult receives planData prop
        │
        ├── BudgetBreakdownChart  (Recharts donut, Framer Motion)
        ├── ItineraryCard × N     (collapsible, day-by-day)
        ├── Transport cards
        ├── Accommodation cards
        ├── FoodGuide section
        ├── BudgetTips (save %, upgrade $)
        └── MinimumFarePanel
```

### Zustand Store Actions

| Action               | API call                  | Updates state         |
|----------------------|---------------------------|-----------------------|
| `generatePlan()`     | POST /api/travel/plan     | `currentPlan`         |
| `generateMinimumFare()` | POST /api/travel/minimum-fare | `minimumFare`  |
| `savePlan(planId)`   | POST /api/travel/save/:id | `currentPlan.isSaved` |
| `fetchHistory(page)` | GET  /api/travel/history  | `savedPlans`          |
| `deletePlan(planId)` | DELETE /api/travel/plan/:id | removes from `savedPlans` |

---

## 10. Edge Case Handling

| Scenario                          | Behaviour                                                  |
|-----------------------------------|------------------------------------------------------------|
| Budget = $1                       | Tier: `shoestring`; plan includes hitchhiking, free camping, water-fast jokes aside |
| Budget = $1,000,000               | Tier: `luxury`; ratio >> 3, plan includes private jets, 5-star |
| Same city (source == destination)  | Prompt rule #10 triggers local exploration / staycation plan |
| International route               | Prompt rule #11 adds visa cost warning to `warnings[]`     |
| Unknown route pair                | Falls back to `default: 500 USD` baseline                  |
| Unknown currency                  | `normalizeToUSD` falls back to rate `1` (treats as USD)    |
| LLM API key not set               | Skips that provider, tries next, lands on template fallback |
| LLM returns invalid JSON          | `JSON.parse` throws → caught → tries next provider         |
| Guest user (not logged in)        | Plan generated and saved with `userId: null`               |
| Guest tries to save a plan        | Frontend shows "Please log in to save plans" toast         |

---

## 11. Configuration & Extensibility

### Environment Variables

```bash
# Primary LLM (Google Gemini — generous free tier)
GEMINI_API_KEY=your_key_here

# Secondary LLM (OpenAI)
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini          # default
```

### Adding a New LLM Provider

1. Create `callNewProvider(systemPrompt, userPrompt)` in `travelPlanAI.service.js`
2. Add it to the priority chain in `generateTravelPlan()` before the fallback
3. No changes needed anywhere else

### Adding a New Route Baseline

In `budgetClassifier.service.js`:
```javascript
const ROUTE_BASELINES = {
  'london-paris': 300,   // ← add here
  ...
};
```

### Changing Allocation Percentages

In `budgetAllocator.service.js`:
```javascript
const BUDGET_ALLOCATION = {
  medium: { transport: 0.35, accommodation: 0.30, food: 0.20, activities: 0.15 },
  //                   ^^^^  change this to 0.30 to give more room to accommodation
};
```

No other files need changing — the allocator output feeds directly into the
prompt builder via the controller.

### Future: Local Fare Database Integration

Both services contain a `TODO` comment marking the exact replacement point:

```javascript
// TODO: Replace AI estimates with localFareDB.lookup(source, destination)
//       when local fare database is available.
```

When a real fare DB is available, replace `ROUTE_BASELINES` lookups with live
DB queries and the AI estimated allocation hints with actual price bands.

---

## 12. Future Roadmap

| Feature                        | Where to add                                              |
|--------------------------------|-----------------------------------------------------------|
| Live exchange rates            | `budgetClassifier.service.js` → `EXCHANGE_RATES_TO_USD`  |
| Real train/flight fares        | `budgetAllocator.service.js` → category allocations      |
| Route baseline from live DB    | `budgetClassifier.service.js` → `getRouteBaseline()`     |
| Caching frequent routes        | `travelPlanAI.service.js` → add Redis layer before LLM   |
| Multi-destination routing      | New `multiCityBudgetOptimizer.service.js`                 |
| User preference learning       | Add `preferences` field to `TravelPlan` schema           |
| Carbon footprint scoring       | Add `carbonScore` to `transportOptions` items            |
| Real-time hotel/flight booking | Add booking-deeplink fields to transport & accommodation  |

---

*This document describes the algorithm as of March 2026. All prices and tier
thresholds are AI-estimated defaults. Production deployments should replace
static baselines with live fare data.*
