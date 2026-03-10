/**
 * Restaurant Model
 * Stores restaurant information for food recommendations
 */

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    description: String,

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
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Cuisine Type
    cuisine: {
      type: [String], // Indian, Chinese, Italian, etc.
      required: true,
    },
    specialties: [String], // Signature dishes

    // Restaurant Type
    type: {
      type: String,
      enum: [
        'fine-dining',
        'casual-dining',
        'cafe',
        'fast-food',
        'street-food',
        'food-court',
        'dhaba',
        'bakery',
      ],
      default: 'casual-dining',
    },

    // Meal Types Served
    mealsServed: {
      breakfast: {
        type: Boolean,
        default: false,
      },
      lunch: {
        type: Boolean,
        default: true,
      },
      dinner: {
        type: Boolean,
        default: true,
      },
      snacks: {
        type: Boolean,
        default: false,
      },
    },

    // Price Range
    pricing: {
      currency: {
        type: String,
        default: 'INR',
      },
      priceRange: {
        type: String,
        enum: ['$', '$$', '$$$', '$$$$'], // Budget to Expensive
        required: true,
      },
      averageCostForTwo: {
        type: Number,
        required: true,
      },
      averageCostPerMeal: Number,
    },

    // Ratings
    rating: {
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
      food: Number,
      service: Number,
      ambiance: Number,
      hygiene: Number,
    },

    // Operating Hours
    timings: {
      monday: { open: String, close: String, isClosed: Boolean },
      tuesday: { open: String, close: String, isClosed: Boolean },
      wednesday: { open: String, close: String, isClosed: Boolean },
      thursday: { open: String, close: String, isClosed: Boolean },
      friday: { open: String, close: String, isClosed: Boolean },
      saturday: { open: String, close: String, isClosed: Boolean },
      sunday: { open: String, close: String, isClosed: Boolean },
    },
    opensAt: String, // "10:00 AM"
    closesAt: String, // "11:00 PM"

    // Features & Amenities
    features: {
      seating: [String], // Indoor, Outdoor, Rooftop, etc.
      parking: {
        available: Boolean,
        type: String, // Valet, Self, Street
      },
      wifi: Boolean,
      ac: Boolean,
      cardAccepted: Boolean,
      homeDelivery: Boolean,
      takeaway: Boolean,
      reservationRequired: Boolean,
    },

    // Dietary Options
    dietaryOptions: {
      vegetarian: Boolean,
      vegan: Boolean,
      nonVegetarian: Boolean,
      jain: Boolean,
      glutenFree: Boolean,
      halal: Boolean,
    },

    // Popular Dishes (with estimated prices)
    popularDishes: [
      {
        name: String,
        price: Number,
        category: {
          type: String,
          enum: ['starter', 'main-course', 'dessert', 'beverage', 'snack'],
        },
        isVeg: Boolean,
        description: String,
      },
    ],

    // Menu Categories Available
    menuCategories: [String], // Appetizers, Main Course, Desserts, etc.

    // Contact Information
    contact: {
      phone: String,
      email: String,
      website: String,
      socialMedia: {
        instagram: String,
        facebook: String,
      },
    },

    // Images
    images: [
      {
        url: String,
        caption: String,
        type: {
          type: String,
          enum: ['interior', 'food', 'exterior', 'menu'],
        },
      },
    ],

    // Good For
    goodFor: [String], // Family, Couples, Groups, Solo, Business Meetings

    // Must Try Items
    mustTry: [String],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isOpenNow: Boolean,

    // Data Source
    source: {
      type: String,
      enum: ['manual', 'api', 'zomato', 'swiggy'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
restaurantSchema.index({ 'location.city': 1, 'pricing.priceRange': 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ 'rating.average': -1 });
restaurantSchema.index({ isActive: 1 });

// ==================== METHODS ====================

/**
 * Check if restaurant is open at given time
 * @param {Date} dateTime
 * @returns {boolean}
 */
restaurantSchema.methods.isOpenAt = function (dateTime = new Date()) {
  // Simplified check - can be enhanced with actual timing logic
  return this.isActive;
};

/**
 * Get estimated cost per person for a meal
 * @returns {number}
 */
restaurantSchema.methods.getEstimatedCostPerPerson = function () {
  return Math.round(this.pricing.averageCostForTwo / 2);
};

/**
 * Calculate estimated meal cost for number of people
 * @param {number} numberOfPeople
 * @param {number} mealsPerDay
 * @returns {number}
 */
restaurantSchema.methods.calculateMealCost = function (
  numberOfPeople = 1,
  mealsPerDay = 3
) {
  const costPerPerson = this.getEstimatedCostPerPerson();
  return costPerPerson * numberOfPeople * mealsPerDay;
};

// ==================== STATIC METHODS ====================

/**
 * Find restaurants within budget
 * @param {string} city
 * @param {string} priceRange
 * @param {number} minRating
 * @returns {Promise<Array>}
 */
restaurantSchema.statics.findByBudget = function (
  city,
  priceRange = '$$',
  minRating = 3.5
) {
  return this.find({
    'location.city': new RegExp(city, 'i'),
    'pricing.priceRange': { $in: ['$', priceRange] },
    'rating.average': { $gte: minRating },
    isActive: true,
  })
    .sort({ 'rating.average': -1 })
    .limit(15)
    .exec();
};

/**
 * Get budget-friendly restaurants
 * @param {string} city
 * @param {number} maxCostForTwo
 * @returns {Promise<Array>}
 */
restaurantSchema.statics.getBudgetFriendly = function (city, maxCostForTwo = 500) {
  return this.find({
    'location.city': new RegExp(city, 'i'),
    'pricing.averageCostForTwo': { $lte: maxCostForTwo },
    isActive: true,
  })
    .sort({ 'rating.average': -1, 'pricing.averageCostForTwo': 1 })
    .limit(20)
    .exec();
};

/**
 * Get restaurants by cuisine
 * @param {string} city
 * @param {string} cuisine
 * @returns {Promise<Array>}
 */
restaurantSchema.statics.getByCuisine = function (city, cuisine) {
  return this.find({
    'location.city': new RegExp(city, 'i'),
    cuisine: new RegExp(cuisine, 'i'),
    isActive: true,
  })
    .sort({ 'rating.average': -1 })
    .limit(10)
    .exec();
};

/**
 * Get top-rated restaurants in a city
 * @param {string} city
 * @param {number} limit
 * @returns {Promise<Array>}
 */
restaurantSchema.statics.getTopRated = function (city, limit = 10) {
  return this.find({
    'location.city': new RegExp(city, 'i'),
    'rating.average': { $gte: 4 },
    isActive: true,
  })
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(limit)
    .exec();
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
