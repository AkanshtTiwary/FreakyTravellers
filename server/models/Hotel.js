/**
 * Hotel Model
 * Stores hotel information and pricing
 */

const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Hotel name is required'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },

    // Location
    location: {
      city: {
        type: String,
        required: true,
      },
      area: String,
      address: String,
      state: String,
      country: {
        type: String,
        default: 'India',
      },
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      nearbyLandmarks: [String],
    },

    // Hotel Type & Category
    type: {
      type: String,
      enum: ['hotel', 'resort', 'hostel', 'guesthouse', 'apartment', 'homestay'],
      default: 'hotel',
    },
    starRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    userRating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    // Pricing
    pricing: {
      currency: {
        type: String,
        default: 'INR',
      },
      pricePerNight: {
        type: Number,
        required: true,
        min: 0,
      },
      weekendPrice: Number,
      taxes: {
        type: Number,
        default: 0,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      discounts: {
        available: {
          type: Boolean,
          default: false,
        },
        percentage: Number,
        seasonal: Boolean,
      },
    },

    // Room Information
    rooms: [
      {
        type: {
          type: String,
          enum: ['single', 'double', 'deluxe', 'suite', 'dormitory'],
        },
        capacity: Number,
        pricePerNight: Number,
        available: {
          type: Boolean,
          default: true,
        },
        amenities: [String],
      },
    ],

    // Amenities & Facilities
    amenities: {
      basic: [String], // WiFi, AC, TV, etc.
      bathroom: [String], // Hot Water, Geyser, etc.
      kitchen: [String], // Kitchenette, Fridge, etc.
      entertainment: [String], // TV, Music System, etc.
      safety: [String], // CCTV, Security, Fire Extinguisher, etc.
    },
    facilities: [String], // Pool, Gym, Restaurant, Parking, etc.

    // Policies
    policies: {
      checkIn: String, // "2:00 PM"
      checkOut: String, // "11:00 AM"
      cancellation: {
        allowed: {
          type: Boolean,
          default: true,
        },
        policy: String,
        refundable: Boolean,
      },
      petsAllowed: {
        type: Boolean,
        default: false,
      },
      smokingAllowed: {
        type: Boolean,
        default: false,
      },
    },

    // Contact Information
    contact: {
      phone: String,
      email: String,
      website: String,
    },

    // Images
    images: [
      {
        url: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Availability
    availability: {
      isActive: {
        type: Boolean,
        default: true,
      },
      totalRooms: Number,
      availableRooms: Number,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Popular Features
    popularFor: [String], // Family, Couple, Business, Budget, Luxury, etc.

    // Nearby Attractions
    nearbyAttractions: [
      {
        name: String,
        distance: String, // "2 km"
        type: String, // Museum, Park, Mall, etc.
      },
    ],

    // Data Source
    source: {
      type: String,
      enum: ['manual', 'api', 'partner'],
      default: 'manual',
    },
    apiProvider: String,

    // Reviews Summary
    reviewsSummary: {
      cleanliness: Number,
      service: Number,
      location: Number,
      valueForMoney: Number,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
hotelSchema.index({ 'location.city': 1, 'pricing.pricePerNight': 1 });
hotelSchema.index({ type: 1, starRating: 1 });
hotelSchema.index({ 'userRating.average': -1 });
hotelSchema.index({ 'availability.isActive': 1 });

// ==================== METHODS ====================

/**
 * Calculate total price for number of nights
 * @param {number} nights
 * @returns {number}
 */
hotelSchema.methods.calculateTotalPrice = function (nights = 1) {
  const basePrice = this.pricing.pricePerNight * nights;
  const taxes = this.pricing.taxes || 0;
  const serviceFee = this.pricing.serviceFee || 0;
  let total = basePrice + taxes + serviceFee;

  // Apply discount if available
  if (this.pricing.discounts && this.pricing.discounts.available) {
    const discount = (total * this.pricing.discounts.percentage) / 100;
    total -= discount;
  }

  return Math.round(total);
};

/**
 * Update availability
 * @param {number} roomsBooked
 */
hotelSchema.methods.updateAvailability = function (roomsBooked) {
  if (this.availability.availableRooms !== undefined) {
    this.availability.availableRooms -= roomsBooked;
    this.availability.lastUpdated = Date.now();
  }
  return this.save();
};

/**
 * Check if hotel is available
 * @returns {boolean}
 */
hotelSchema.methods.isAvailable = function () {
  return (
    this.availability.isActive &&
    (this.availability.availableRooms === undefined ||
      this.availability.availableRooms > 0)
  );
};

// ==================== STATIC METHODS ====================

/**
 * Find hotels within budget in a city
 * @param {string} city
 * @param {number} budgetPerNight
 * @param {number} minRating
 * @returns {Promise<Array>}
 */
hotelSchema.statics.findByBudget = function (
  city,
  budgetPerNight,
  minRating = 3
) {
  return this.find({
    'location.city': new RegExp(city, 'i'),
    'pricing.pricePerNight': { $lte: budgetPerNight },
    'userRating.average': { $gte: minRating },
    'availability.isActive': true,
  })
    .sort({ 'userRating.average': -1, 'pricing.pricePerNight': 1 })
    .limit(10)
    .exec();
};

/**
 * Get cheapest hotel in a city
 * @param {string} city
 * @returns {Promise<object>}
 */
hotelSchema.statics.getCheapest = function (city) {
  return this.findOne({
    'location.city': new RegExp(city, 'i'),
    'availability.isActive': true,
  })
    .sort({ 'pricing.pricePerNight': 1 })
    .exec();
};

/**
 * Get hotels by rating range
 * @param {string} city
 * @param {number} minRating
 * @param {number} maxPrice
 * @returns {Promise<Array>}
 */
hotelSchema.statics.getByRating = function (city, minRating = 4, maxPrice = Infinity) {
  return this.find({
    'location.city': new RegExp(city, 'i'),
    'userRating.average': { $gte: minRating },
    'pricing.pricePerNight': { $lte: maxPrice },
    'availability.isActive': true,
  })
    .sort({ 'userRating.average': -1 })
    .limit(20)
    .exec();
};

module.exports = mongoose.model('Hotel', hotelSchema);
