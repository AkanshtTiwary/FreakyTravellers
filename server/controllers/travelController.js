/**
 * Travel/Trip Controller
 * Handles trip planning, optimization, and trip history
 */

const Trip = require('../models/Trip');
const { optimizeTripBudget } = require('../utils/optimizationAlgorithm');
const { optimizeMultiDestinationTrip } = require('../services/multiDestinationOptimizer');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Optimize trip based on budget
 * @route   POST /api/trips/optimize
 * @access  Private or Public (with optional auth)
 */
exports.optimizeTrip = asyncHandler(async (req, res) => {
  const { source, destination, totalBudget, numberOfTravelers = 1 } = req.body;

  console.log(`\n🚀 Starting trip optimization...`);
  console.log(`📍 From: ${source} → To: ${destination}`);
  console.log(`💰 Budget: ₹${totalBudget}`);
  console.log(`👥 Travelers: ${numberOfTravelers}`);

  // Run optimization algorithm
  const optimizationResult = await optimizeTripBudget({
    source,
    destination,
    totalBudget: parseFloat(totalBudget),
    numberOfTravelers: parseInt(numberOfTravelers),
  });

  // Create trip document
  const tripData = {
    user: req.user?.id || null, // Optional auth
    source: {
      city: source,
      country: 'India',
    },
    destination: {
      city: destination,
      country: 'India',
    },
    totalBudget: parseFloat(totalBudget),
    currency: 'INR',
    status: 'planned',
    isOptimized: optimizationResult.isOptimized,
    optimizationScore: optimizationResult.optimizationScore,
  };

  // Add transport if found AND has valid required fields
  if (
    optimizationResult.transport &&
    optimizationResult.transport.mode &&
    (optimizationResult.transport.totalCost != null)
  ) {
    tripData.transport = {
      mode: optimizationResult.transport.mode,
      provider: optimizationResult.transport.provider,
      class: optimizationResult.transport.class,
      cost: optimizationResult.transport.totalCost * numberOfTravelers,
      duration: optimizationResult.transport.duration,
      departure: optimizationResult.transport.departure,
      arrival: optimizationResult.transport.arrival,
      details: optimizationResult.transport,
    };
  }

  // Add accommodation if found
  if (optimizationResult.accommodation) {
    tripData.accommodation = {
      type: optimizationResult.accommodation.type,
      name: optimizationResult.accommodation.name,
      rating: optimizationResult.accommodation.rating,
      location: optimizationResult.accommodation.location,
      pricePerNight: optimizationResult.accommodation.pricePerNight,
      totalCost: optimizationResult.accommodation.totalCost,
      amenities: optimizationResult.accommodation.amenities,
      details: optimizationResult.accommodation,
    };
  }

  // Add budget breakdown
  if (optimizationResult.budgetBreakdown) {
    tripData.budgetBreakdown = optimizationResult.budgetBreakdown;
  }

  // Add duration
  if (optimizationResult.duration) {
    tripData.duration = optimizationResult.duration;
  }

  // Add recommendations
  if (optimizationResult.recommendations) {
    tripData.recommendations = optimizationResult.recommendations;
  }

  // Add optimization notes
  if (optimizationResult.optimizationNotes) {
    tripData.optimizationNotes = optimizationResult.optimizationNotes;
  }

  // Add alternative plan if exists
  if (optimizationResult.alternativePlan) {
    tripData.alternativePlan = optimizationResult.alternativePlan;
  }

  // Save trip to database
  const trip = await Trip.create(tripData);

  console.log(`✅ Trip optimization completed!`);
  console.log(`🎯 Optimization Score: ${optimizationResult.optimizationScore}/100\n`);

  res.status(200).json({
    success: true,
    message: optimizationResult.isOptimized
      ? 'Trip optimized successfully!'
      : 'Unable to optimize with current budget. See alternatives.',
    data: {
      tripId: trip._id,
      optimization: optimizationResult,
      trip: {
        source: trip.source.city,
        destination: trip.destination.city,
        budget: trip.totalBudget,
        duration: trip.duration,
        status: trip.status,
      },
    },
  });
});

/**
 * @desc    Optimize multi-destination trip with real API data
 * @route   POST /api/trips/optimize-multi
 * @access  Private or Public (with optional auth)
 */
exports.optimizeMultiDestinationTrip = asyncHandler(async (req, res) => {
  const {
    startCity,
    destinations,
    totalBudget,
    travelDates,
    numberOfTravelers = 1,
  } = req.body;

  // Validation
  if (!startCity || !destinations || !totalBudget || !travelDates) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: startCity, destinations, totalBudget, travelDates',
    });
  }

  if (!Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Destinations must be a non-empty array',
    });
  }

  if (destinations.length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 5 destinations allowed',
    });
  }

  if (!travelDates.startDate || !travelDates.endDate) {
    return res.status(400).json({
      success: false,
      message: 'Travel dates must include startDate and endDate',
    });
  }

  console.log(`\n🚀 Starting multi-destination trip optimization...`);
  console.log(`📍 From: ${startCity}`);
  console.log(`🌍 Destinations: ${destinations.join(', ')}`);
  console.log(`💰 Budget: ₹${totalBudget}`);
  console.log(`👥 Travelers: ${numberOfTravelers}`);

  // Run multi-destination optimization
  const optimizationResult = await optimizeMultiDestinationTrip({
    startCity,
    destinations,
    totalBudget: parseFloat(totalBudget),
    travelDates,
    numberOfTravelers: parseInt(numberOfTravelers),
  });

  if (!optimizationResult.success) {
    return res.status(400).json(optimizationResult);
  }

  // Create trip document for multi-destination trip
  const tripData = {
    user: req.user?.id || null,
    source: {
      city: startCity,
      country: 'India',
    },
    destination: {
      city: destinations[destinations.length - 1], // Final destination
      country: 'India',
    },
    destinations: destinations.map(city => ({ city, country: 'India' })),
    totalBudget: parseFloat(totalBudget),
    currency: 'INR',
    status: 'planned',
    isOptimized: optimizationResult.isOptimized,
    optimizationScore: optimizationResult.optimizationScore,
    travelDates: {
      startDate: new Date(travelDates.startDate),
      endDate: new Date(travelDates.endDate),
    },
    budgetBreakdown: optimizationResult.budgetBreakdown,
    travelPlan: optimizationResult.travelPlan,
    hotelPlan: optimizationResult.hotelPlan,
    recommendations: optimizationResult.suggestions,
  };

  // Save trip to database
  const trip = await Trip.create(tripData);

  console.log(`✅ Multi-destination trip optimization completed!`);
  console.log(`🎯 Optimization Score: ${optimizationResult.optimizationScore}/100\n`);

  res.status(200).json({
    success: true,
    message: optimizationResult.isOptimized
      ? 'Multi-destination trip optimized successfully!'
      : 'Unable to optimize with current budget. See alternatives.',
    data: {
      tripId: trip._id,
      optimization: optimizationResult,
      trip: {
        startCity: trip.source.city,
        destinations: trip.destinations?.map(d => d.city) || destinations,
        budget: trip.totalBudget,
        travelDates: trip.travelDates,
        status: trip.status,
      },
    },
  });
});

/**
 * @desc    Get trip by ID
 * @route   GET /api/trips/:id
 * @access  Private
 */
exports.getTripById = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: 'Trip not found',
    });
  }

  // Check if user has access to this trip (own trip or admin)
  if (
    req.user &&
    trip.user &&
    trip.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this trip',
    });
  }

  res.status(200).json({
    success: true,
    data: { trip },
  });
});

/**
 * @desc    Get user's trip history
 * @route   GET /api/trips/my-trips
 * @access  Private
 */
exports.getMyTrips = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const trips = await Trip.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Trip.countDocuments({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: {
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Get all trips (Admin only)
 * @route   GET /api/trips
 * @access  Private (Admin)
 */
exports.getAllTrips = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  // Filter by status if provided
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by optimization status
  if (req.query.isOptimized !== undefined) {
    filter.isOptimized = req.query.isOptimized === 'true';
  }

  const trips = await Trip.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Trip.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @desc    Update trip status
 * @route   PUT /api/trips/:id/status
 * @access  Private
 */
exports.updateTripStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: 'Trip not found',
    });
  }

  // Check authorization
  if (
    trip.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this trip',
    });
  }

  trip.status = status;
  await trip.save();

  res.status(200).json({
    success: true,
    message: 'Trip status updated',
    data: { trip },
  });
});

/**
 * @desc    Delete trip
 * @route   DELETE /api/trips/:id
 * @access  Private
 */
exports.deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) {
    return res.status(404).json({
      success: false,
      message: 'Trip not found',
    });
  }

  // Check authorization
  if (
    trip.user.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this trip',
    });
  }

  await trip.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Trip deleted successfully',
  });
});

/**
 * @desc    Get trip statistics for user
 * @route   GET /api/trips/stats
 * @access  Private
 */
exports.getTripStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await Trip.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$totalBudget' },
      },
    },
  ]);

  const totalTrips = await Trip.countDocuments({ user: userId });
  const avgOptimizationScore = await Trip.aggregate([
    { $match: { user: userId, isOptimized: true } },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$optimizationScore' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalTrips,
      averageOptimizationScore: avgOptimizationScore[0]?.avgScore || 0,
      statusBreakdown: stats,
    },
  });
});

/**
 * @desc    Search popular destinations
 * @route   GET /api/trips/popular-destinations
 * @access  Public
 */
exports.getPopularDestinations = asyncHandler(async (req, res) => {
  const popularDestinations = await Trip.aggregate([
    { $match: { isOptimized: true } },
    {
      $group: {
        _id: '$destination.city',
        count: { $sum: 1 },
        avgBudget: { $avg: '$totalBudget' },
        avgOptimizationScore: { $avg: '$optimizationScore' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    data: {
      destinations: popularDestinations.map((dest) => ({
        city: dest._id,
        trips: dest.count,
        averageBudget: Math.round(dest.avgBudget),
        averageScore: Math.round(dest.avgOptimizationScore),
      })),
    },
  });
});
