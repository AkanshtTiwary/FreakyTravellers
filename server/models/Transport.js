/**
 * Transport Model
 * Stores transport options and pricing data
 * This can be used for caching API responses or manual data entry
 */

const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema(
  {
    // Route Information
    route: {
      source: {
        city: {
          type: String,
          required: true,
          trim: true,
        },
        code: String, // Airport/Station code
        state: String,
      },
      destination: {
        city: {
          type: String,
          required: true,
          trim: true,
        },
        code: String,
        state: String,
      },
    },

    // Transport Type
    mode: {
      type: String,
      enum: ['flight', 'train', 'bus', 'cab'],
      required: true,
    },

    // Provider Details
    provider: {
      name: String, // Airline/Bus Operator/Train name
      code: String, // Flight number, Train number, Bus number
      rating: {
        type: Number,
        min: 0,
        max: 5,
      },
    },

    // Class/Category
    class: {
      type: String,
      enum: [
        'economy',
        'premium-economy',
        'business',
        'first-class',
        'sleeper',
        'ac',
        'non-ac',
        '2ac',
        '3ac',
        '1ac',
        'general',
      ],
    },

    // Timing
    schedule: {
      departure: {
        time: Date,
        location: String, // Terminal/Platform
      },
      arrival: {
        time: Date,
        location: String,
      },
      duration: {
        hours: Number,
        minutes: Number,
      },
      frequency: String, // Daily, Weekly, etc.
    },

    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      taxes: Number,
      fees: Number,
      total: Number,
      discount: {
        available: {
          type: Boolean,
          default: false,
        },
        percentage: Number,
        amount: Number,
        code: String,
      },
    },

    // Availability
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      seatsAvailable: Number,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Amenities & Features
    amenities: [String], // WiFi, Meals, Charging Points, etc.
    features: {
      cancellable: {
        type: Boolean,
        default: true,
      },
      refundable: {
        type: Boolean,
        default: false,
      },
      reschedulable: {
        type: Boolean,
        default: true,
      },
    },

    // Additional Information
    baggage: {
      cabin: String, // "7 Kg"
      checkIn: String, // "15 Kg"
    },
    stops: {
      type: Number,
      default: 0,
    },
    layovers: [
      {
        city: String,
        duration: String,
      },
    ],

    // Data Source
    source: {
      type: String,
      enum: ['manual', 'api', 'web-scraping'],
      default: 'manual',
    },
    apiProvider: String, // Amadeus, Skyscanner, etc.

    // Valid Until
    validUntil: Date,

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
transportSchema.index({ 'route.source.city': 1, 'route.destination.city': 1 });
transportSchema.index({ mode: 1, 'pricing.total': 1 });
transportSchema.index({ 'schedule.departure.time': 1 });
transportSchema.index({ isActive: 1, 'availability.isAvailable': 1 });

// ==================== METHODS ====================

/**
 * Calculate total price including taxes and fees
 */
transportSchema.methods.calculateTotalPrice = function () {
  const { basePrice, taxes = 0, fees = 0 } = this.pricing;
  let total = basePrice + taxes + fees;

  // Apply discount if available
  if (this.pricing.discount && this.pricing.discount.available) {
    if (this.pricing.discount.percentage) {
      total -= (total * this.pricing.discount.percentage) / 100;
    } else if (this.pricing.discount.amount) {
      total -= this.pricing.discount.amount;
    }
  }

  this.pricing.total = Math.round(total);
  return this.pricing.total;
};

/**
 * Check if transport is available for given date
 * @param {Date} date
 * @returns {boolean}
 */
transportSchema.methods.isAvailableForDate = function (date) {
  if (!this.availability.isAvailable) return false;
  if (this.validUntil && new Date(this.validUntil) < new Date(date)) return false;
  return true;
};

// ==================== STATIC METHODS ====================

/**
 * Find cheapest transport option for a route
 * @param {string} source - Source city
 * @param {string} destination - Destination city
 * @param {string} mode - Transport mode (optional)
 * @returns {Promise<object>}
 */
transportSchema.statics.findCheapest = function (source, destination, mode = null) {
  const query = {
    'route.source.city': new RegExp(source, 'i'),
    'route.destination.city': new RegExp(destination, 'i'),
    isActive: true,
    'availability.isAvailable': true,
  };

  if (mode) {
    query.mode = mode;
  }

  return this.findOne(query).sort({ 'pricing.total': 1 }).exec();
};

/**
 * Get all transport options for a route
 * @param {string} source
 * @param {string} destination
 * @returns {Promise<Array>}
 */
transportSchema.statics.getRouteOptions = function (source, destination) {
  return this.find({
    'route.source.city': new RegExp(source, 'i'),
    'route.destination.city': new RegExp(destination, 'i'),
    isActive: true,
    'availability.isAvailable': true,
  })
    .sort({ 'pricing.total': 1 })
    .exec();
};

module.exports = mongoose.model('Transport', transportSchema);
