/**
 * Trip Model
 * Stores trip optimization results and user trip history
 */

const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    // User Reference (optional - allows guest searches)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },

    // Trip Basic Information
    source: {
      city: {
        type: String,
        required: [true, 'Source city is required'],
        trim: true,
      },
      state: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    destination: {
      city: {
        type: String,
        required: [true, 'Destination city is required'],
        trim: true,
      },
      state: String,
      country: {
        type: String,
        default: 'India',
      },
    },

    // Multi-Destination Support
    destinations: [
      {
        city: String,
        state: String,
        country: {
          type: String,
          default: 'India',
        },
      },
    ],

    // Travel Dates
    travelDates: {
      startDate: Date,
      endDate: Date,
    },

    // Multi-Destination Travel Plan
    travelPlan: [
      {
        from: String,
        to: String,
        mode: String,
        provider: String,
        details: mongoose.Schema.Types.Mixed,
        costPerPerson: Number,
        totalCost: Number,
      },
    ],

    // Multi-Destination Hotel Plan
    hotelPlan: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Budget Information
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [1, 'Budget must be at least ₹1'],
    },
    currency: {
      type: String,
      default: 'INR',
    },

    // Trip Duration (calculated based on budget)
    duration: {
      days: {
        type: Number,
        default: 1,
      },
      nights: {
        type: Number,
        default: 0,
      },
    },

    // Optimized Transport
    transport: {
      mode: {
        type: String,
        enum: ['flight', 'train', 'bus', 'cab', 'mixed', 'rickshaw', 'walk', 'shared-auto'],
        required: false,
      },
      provider: String,
      class: String, // Economy, Business, Sleeper, AC, Non-AC
      cost: {
        type: Number,
        required: false,
      },
      duration: String, // "5h 30m"
      departure: {
        time: Date,
        location: String,
      },
      arrival: {
        time: Date,
        location: String,
      },
      details: mongoose.Schema.Types.Mixed, // Additional transport details
    },

    // Accommodation
    accommodation: {
      type: {
        type: String,
        enum: ['hotel', 'hostel', 'guesthouse', 'resort', 'airbnb'],
        default: 'hotel',
      },
      name: String,
      rating: Number,
      location: String,
      pricePerNight: Number,
      totalCost: Number,
      amenities: [String],
      details: mongoose.Schema.Types.Mixed,
    },

    // Budget Breakdown
    budgetBreakdown: {
      transport: {
        allocated: Number,
        spent: Number,
      },
      accommodation: {
        allocated: Number,
        spent: Number,
        percentage: {
          type: Number,
          default: 40,
        },
      },
      food: {
        allocated: Number,
        estimated: Number,
        percentage: {
          type: Number,
          default: 30,
        },
      },
      localTransport: {
        allocated: Number,
        estimated: Number,
        percentage: {
          type: Number,
          default: 30,
        },
      },
      activities: {
        allocated: Number,
        estimated: Number,
      },
      miscellaneous: {
        allocated: Number,
      },
      totalAllocated: Number,
      remainingBudget: Number,
    },

    // Recommendations
    recommendations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // AI Optimization Suggestions
    optimizationNotes: [
      {
        type: {
          type: String,
          enum: ['info', 'warning', 'suggestion', 'alternative', 'tip'],
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Alternative Plan (if original budget is too low)
    alternativePlan: {
      hasAlternative: {
        type: Boolean,
        default: false,
      },
      suggestedDestination: String,
      suggestedBudget: Number,
      suggestedDuration: String,
      reason: String,
    },

    // Trip Status
    status: {
      type: String,
      enum: ['draft', 'planned', 'booked', 'completed', 'cancelled'],
      default: 'planned',
    },

    // Booking Reference (if booked)
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },

    // Search Metadata
    searchDate: {
      type: Date,
      default: Date.now,
    },
    isOptimized: {
      type: Boolean,
      default: false,
    },
    optimizationScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
tripSchema.index({ user: 1, createdAt: -1 });
tripSchema.index({ 'source.city': 1, 'destination.city': 1 });
tripSchema.index({ status: 1 });

// ==================== VIRTUAL FIELDS ====================
tripSchema.virtual('budgetUtilization').get(function () {
  if (this.budgetBreakdown && this.budgetBreakdown.totalAllocated) {
    return ((this.budgetBreakdown.totalAllocated / this.totalBudget) * 100).toFixed(2);
  }
  return 0;
});

// ==================== METHODS ====================
/**
 * Calculate budget breakdown based on allocation percentages
 */
tripSchema.methods.calculateBudgetBreakdown = function (transportCost) {
  const remainingAfterTransport = this.totalBudget - transportCost;

  this.budgetBreakdown = {
    transport: {
      allocated: transportCost,
      spent: transportCost,
    },
    accommodation: {
      allocated: remainingAfterTransport * 0.4, // 40%
      percentage: 40,
    },
    food: {
      allocated: remainingAfterTransport * 0.3, // 30%
      percentage: 30,
    },
    localTransport: {
      allocated: remainingAfterTransport * 0.3, // 30%
      percentage: 30,
    },
    totalAllocated: this.totalBudget,
    remainingBudget: 0,
  };

  return this.budgetBreakdown;
};

// Ensure virtuals are included in JSON
tripSchema.set('toJSON', { virtuals: true });
tripSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);
