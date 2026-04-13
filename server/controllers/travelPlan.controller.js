/**
 * Travel Plan Controller
 * Handles AI-driven budget-adaptive travel plan generation and CRUD.
 */

const TravelPlan                           = require('../models/TravelPlan');
const { classifyBudget }                   = require('../services/budgetClassifier.service');
const { allocateBudget }                   = require('../services/budgetAllocator.service');
const { buildTravelPlanPrompt }            = require('../services/aiPromptBuilder.service');
const { generateTravelPlan }               = require('../services/travelPlanAI.service');
const { asyncHandler }                     = require('../middleware/errorHandler');
const { validateIndianDestinations }       = require('../utils/indianCities');

// ---------------------------------------------------------------------------
// Helper: build + call AI plan
// ---------------------------------------------------------------------------
async function buildAndGeneratePlan({ source, destination, budget, currency, travelers, dates, minimumFare = false }) {
  // 1. Classify budget tier relative to this route
  const classification = classifyBudget({ source, destination, budget, currency, travelers });

  // 2. Allocate budget across 4 categories
  const allocation = allocateBudget({
    totalBudget: budget,
    currency,
    tier: classification.tier,
    travelers,
  });

  // 3. Build AI prompt (async — fetches live train data from erail.in)
  const { systemPrompt, userPrompt } = await buildTravelPlanPrompt({
    source,
    destination,
    budget,
    currency,
    travelers,
    tier: classification.label,
    tierEmoji: classification.emoji,
    allocation,
    dates,
    minimumFare,
  });

  // 4. Call LLM (with fallback)
  const { plan, source: aiSource } = await generateTravelPlan({
    systemPrompt,
    userPrompt,
    fallbackContext: {
      source, destination, budget, currency, travelers,
      tier: classification.label,
      tierEmoji: classification.emoji,
      allocation,
    },
  });

  return { plan, aiSource, classification, allocation };
}

// ---------------------------------------------------------------------------
// POST /api/travel/plan
// Generate a new travel plan
// ---------------------------------------------------------------------------
exports.generatePlan = asyncHandler(async (req, res) => {
  const {
    source,
    destination,
    budget,
    currency = 'USD',
    travelers = 1,
    dates,
  } = req.body;

  console.log(`\n🗺️  Travel Plan Request: ${source} → ${destination} | Budget: ${budget} ${currency} | Travelers: ${travelers}`);

  // Validate that both source and destination are in India
  const validation = validateIndianDestinations(source, destination);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
      type: validation.type,
    });
  }

  const { plan, aiSource, classification } = await buildAndGeneratePlan({
    source, destination,
    budget: parseFloat(budget),
    currency: currency.toUpperCase(),
    travelers: parseInt(travelers),
    dates,
    minimumFare: false,
  });

  // Persist the plan
  const travelPlan = await TravelPlan.create({
    userId:         req.user?.id || null,
    source,
    destination,
    budget:         parseFloat(budget),
    currency:       currency.toUpperCase(),
    travelers:      parseInt(travelers),
    dates:          dates || {},
    budgetTier:     classification.tier,
    budgetTierLabel: classification.label,
    generatedPlan:  plan,
    aiSource,
    isMinimumFare:  false,
    isSaved:        false,
  });

  res.status(201).json({
    success: true,
    disclaimer: '⚠️ Prices are AI-estimated. Actual costs may vary. Local fare data integration in progress.',
    planId: travelPlan._id,
    aiSource,
    classification: {
      tier:         classification.tier,
      label:        classification.label,
      emoji:        classification.emoji,
      ratio:        classification.ratio,
      baselineUSD:  classification.baselineUSD,
    },
    plan,
  });
});

// ---------------------------------------------------------------------------
// POST /api/travel/minimum-fare
// Generate a minimum fare variant
// ---------------------------------------------------------------------------
exports.generateMinimumFare = asyncHandler(async (req, res) => {
  const {
    source,
    destination,
    budget,
    currency = 'USD',
    travelers = 1,
    dates,
  } = req.body;

  console.log(`\n💸 Minimum Fare Request: ${source} → ${destination}`);

  const { plan, aiSource, classification } = await buildAndGeneratePlan({
    source, destination,
    budget: parseFloat(budget),
    currency: currency.toUpperCase(),
    travelers: parseInt(travelers),
    dates,
    minimumFare: true,
  });

  const travelPlan = await TravelPlan.create({
    userId:          req.user?.id || null,
    source,
    destination,
    budget:          parseFloat(budget),
    currency:        currency.toUpperCase(),
    travelers:       parseInt(travelers),
    dates:           dates || {},
    budgetTier:      classification.tier,
    budgetTierLabel: classification.label,
    generatedPlan:   plan,
    aiSource,
    isMinimumFare:   true,
    isSaved:         false,
  });

  res.status(201).json({
    success: true,
    disclaimer: '🚧 Local fare data integration coming soon — estimates based on general transport costs.',
    planId: travelPlan._id,
    minimumFareMode: true,
    aiSource,
    plan,
  });
});

// ---------------------------------------------------------------------------
// GET /api/travel/history  (JWT protected)
// ---------------------------------------------------------------------------
exports.getPlanHistory = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const [plans, total] = await Promise.all([
    TravelPlan.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-generatedPlan'),       // exclude large field from list view
    TravelPlan.countDocuments({ userId: req.user.id }),
  ]);

  res.status(200).json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    plans,
  });
});

// ---------------------------------------------------------------------------
// GET /api/travel/plan/:planId  (JWT protected)
// ---------------------------------------------------------------------------
exports.getPlanById = asyncHandler(async (req, res) => {
  const plan = await TravelPlan.findOne({ _id: req.params.planId, userId: req.user.id });

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found' });
  }

  res.status(200).json({ success: true, plan });
});

// ---------------------------------------------------------------------------
// POST /api/travel/save/:planId  (JWT protected)
// ---------------------------------------------------------------------------
exports.savePlan = asyncHandler(async (req, res) => {
  const plan = await TravelPlan.findOneAndUpdate(
    { _id: req.params.planId, userId: req.user.id },
    { isSaved: true },
    { new: true }
  );

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found or unauthorised' });
  }

  res.status(200).json({ success: true, message: 'Plan saved successfully', plan });
});

// ---------------------------------------------------------------------------
// DELETE /api/travel/plan/:planId  (JWT protected)
// ---------------------------------------------------------------------------
exports.deletePlan = asyncHandler(async (req, res) => {
  const plan = await TravelPlan.findOneAndDelete({ _id: req.params.planId, userId: req.user.id });

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found or unauthorised' });
  }

  res.status(200).json({ success: true, message: 'Plan deleted successfully' });
});
