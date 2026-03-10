/**
 * TravelPlan Model
 * Stores AI-generated travel plans with budget metadata.
 */

const mongoose = require('mongoose');

const travelPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Guests can generate plans without an account
    default: null,
  },
  source: {
    type: String,
    required: [true, 'Source city is required'],
    trim: true,
  },
  destination: {
    type: String,
    required: [true, 'Destination city is required'],
    trim: true,
  },
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [1, 'Budget must be at least 1'],
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
  },
  travelers: {
    type: Number,
    default: 1,
    min: [1, 'At least 1 traveler required'],
    max: [50, 'Maximum 50 travelers'],
  },
  dates: {
    from: { type: Date, default: null },
    to:   { type: Date, default: null },
  },
  budgetTier: {
    type: String,
    enum: ['shoestring', 'budget', 'medium', 'comfort', 'luxury'],
    required: true,
  },
  budgetTierLabel: {
    type: String,
  },
  generatedPlan: {
    type: mongoose.Schema.Types.Mixed, // Full AI JSON response
    required: true,
  },
  aiSource: {
    type: String,
    enum: ['gemini', 'openai', 'fallback'],
    default: 'fallback',
  },
  isMinimumFare: {
    type: Boolean,
    default: false,
  },
  isSaved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups by user
travelPlanSchema.index({ userId: 1, createdAt: -1 });
travelPlanSchema.index({ isSaved: 1, userId: 1 });

module.exports = mongoose.model('TravelPlan', travelPlanSchema);
