/**
 * Trip Optimization Algorithm
 * Core logic for budget-based travel optimization
 * 
 * Algorithm Flow:
 * 1. Fetch all available transport options (bus, train, flight)
 * 2. Sort by price (ascending)
 * 3. Select cheapest transport option
 * 4. Deduct transport cost from budget
 * 5. Allocate remaining budget:
 *    - 40% for accommodation
 *    - 30% for food
 *    - 30% for local transport
 * 6. If budget insufficient:
 *    - Suggest nearby alternative destination
 *    - Suggest shorter duration
 *    - Suggest lower class travel option
 * 7. Return optimized trip plan
 */

const Transport = require('../models/Transport');
const Hotel = require('../models/Hotel');
const Restaurant = require('../models/Restaurant');
const { searchFlights, searchTrains, searchHotels } = require('../services/externalApiService');

/**
 * Main Optimization Function
 * @param {object} params - {source, destination, totalBudget, numberOfTravelers}
 * @returns {Promise<object>} Optimized trip plan
 */
const optimizeTripBudget = async ({
  source,
  destination,
  totalBudget,
  numberOfTravelers = 1,
}) => {
  try {
    const optimizationResult = {
      isOptimized: false,
      optimizationScore: 0,
      transport: null,
      accommodation: null,
      budgetBreakdown: null,
      recommendations: {
        restaurants: [],
        freeFoodSources: [],
        localTransport: [],
        attractions: [],
      },
      optimizationNotes: [],
      alternativePlan: null,
    };

    // ========== STEP 1: Fetch Transport Options ==========
    console.log(`🔍 Searching transport from ${source} to ${destination}...`);

    let transportOptions = await fetchTransportOptions(source, destination);

    if (!transportOptions || transportOptions.length === 0) {
      optimizationResult.optimizationNotes.push({
        type: 'warning',
        message: `No direct transport found. Using estimated costs.`,
      });
      transportOptions = getEstimatedTransportCosts(source, destination);
    }

    // Always append ultra-cheap local options (rickshaw, shared-auto, bus, walk)
    // so any budget — even ₹1 — finds at least one viable transport option
    transportOptions = [...transportOptions, ...getUltraBudgetTransportOptions(source, destination)];

    // ========== STEP 2: Sort — real API data first, then by price ==========
    // Amadeus/real-API results are prioritised over fallback estimates
    transportOptions.sort((a, b) => {
      const aReal = a.apiSource === 'amadeus' || a.apiSource === 'indian_railway' || a.apiSource === 'database';
      const bReal = b.apiSource === 'amadeus' || b.apiSource === 'indian_railway' || b.apiSource === 'database';
      if (aReal && !bReal) return -1;
      if (!aReal && bReal) return 1;
      return a.totalCost - b.totalCost;
    });

    // ========== STEP 3: Find Affordable Transport ==========
    let selectedTransport = null;
    let remainingBudget = 0;
    let budgetMode = 'normal'; // 'normal' | 'tight' | 'ultra'

    // Pass 1: Standard — allow up to 70% of budget for transport
    for (const transport of transportOptions) {
      const transportCost = transport.totalCost * numberOfTravelers;
      if (transportCost <= totalBudget * 0.7) {
        selectedTransport = transport;
        remainingBudget = totalBudget - transportCost;
        budgetMode = 'normal';
        break;
      }
    }

    // Pass 2: Tight budget — allow 100% for transport; use free food/accommodation
    if (!selectedTransport) {
      for (const transport of transportOptions) {
        const transportCost = transport.totalCost * numberOfTravelers;
        if (transportCost <= totalBudget) {
          selectedTransport = transport;
          remainingBudget = Math.max(0, totalBudget - transportCost);
          budgetMode = 'tight';
          break;
        }
      }
    }

    // Pass 3: Ultra mode — use cheapest available, rely entirely on free resources
    if (!selectedTransport) {
      const sortedByPrice = [...transportOptions].sort((a, b) => a.totalCost - b.totalCost);
      if (sortedByPrice.length > 0) {
        selectedTransport = sortedByPrice[0];
        remainingBudget = 0;
        budgetMode = 'ultra';
      }
    }

    // Ultra/impossible mode: build community-resource plan
    if (!selectedTransport || budgetMode === 'ultra') {
      console.log('⚠️ Ultra-low budget — building community-resource plan');
      return handleLowBudgetScenario({
        source,
        destination,
        totalBudget,
        numberOfTravelers,
        cheapestTransport: selectedTransport || transportOptions[0] || null,
      });
    }

    optimizationResult.transport = selectedTransport;

    if (budgetMode === 'tight') {
      optimizationResult.optimizationNotes.push({
        type: 'warning',
        message: `Tight budget detected. Free langar/temple meals and dharamshala stays recommended to stretch your trip.`,
      });
    }

    optimizationResult.optimizationNotes.push({
      type: 'info',
      message: `Selected ${selectedTransport.mode} as the most budget-friendly option`,
    });

    // ========== STEP 4: Calculate Duration Based on Budget ==========
    const tripDuration = calculateTripDuration(remainingBudget, destination);

    // ========== STEP 5: Allocate Remaining Budget ==========
    const budgetBreakdown = allocateBudget(
      totalBudget,
      selectedTransport.totalCost * numberOfTravelers,
      tripDuration.nights,
      numberOfTravelers
    );

    optimizationResult.budgetBreakdown = budgetBreakdown;

    // ========== STEP 6: Find Accommodation ==========
    const accommodation = await findAccommodation(
      destination,
      budgetBreakdown.accommodation.perNight,
      tripDuration.nights
    );

    if (accommodation) {
      optimizationResult.accommodation = accommodation;
      optimizationResult.optimizationNotes.push({
        type: 'info',
        message: `Found suitable accommodation within budget`,
      });
    } else {
      optimizationResult.optimizationNotes.push({
        type: 'warning',
        message: `Limited accommodation options in this budget. Consider increasing budget.`,
      });
    }

    // ========== STEP 7: Get Restaurant Recommendations ==========
    const restaurants = await getRestaurantRecommendations(
      destination,
      budgetBreakdown.food.perDay
    );
    optimizationResult.recommendations.restaurants = restaurants;

    // ========== STEP 8: Get Local Transport Suggestions ==========
    optimizationResult.recommendations.localTransport =
      getLocalTransportSuggestions(budgetBreakdown.localTransport.perDay);

    // ========== STEP 9: Get Attractions ==========
    optimizationResult.recommendations.attractions = getAttractionSuggestions(
      destination,
      budgetBreakdown.activities?.allocated || 0
    );

    // ========== STEP 10: Calculate Optimization Score ==========
    optimizationResult.optimizationScore = calculateOptimizationScore({
      budgetUtilization: (budgetBreakdown.totalAllocated / totalBudget) * 100,
      transportCost: selectedTransport.totalCost,
      hasAccommodation: !!accommodation,
      numberOfOptions: transportOptions.length,
    });

    optimizationResult.isOptimized = true;
    optimizationResult.duration = tripDuration;

    return optimizationResult;
  } catch (error) {
    console.error('❌ Optimization Error:', error);
    throw new Error(`Trip optimization failed: ${error.message}`);
  }
};

/**
 * Fetch transport options — tries Amadeus API first, then DB, then fallback
 * @param {string} source
 * @param {string} destination
 * @returns {Promise<Array>}
 */
const fetchTransportOptions = async (source, destination) => {
  const results = [];

  // ── 1. Try Amadeus flights ──
  try {
    const flights = await searchFlights({ origin: source, destination });
    if (flights && flights.length > 0) {
      console.log(`✅ Amadeus returned ${flights.length} flight(s)`);
      results.push(
        ...flights.map((f) => ({
          mode: 'flight',
          provider: f.airline || f.provider,
          class: f.class || 'Economy',
          totalCost: f.totalCost || f.price,
          duration: f.duration || 'N/A',
          departure: f.departure || null,
          arrival: f.arrival || null,
          flightNumber: f.flightNumber || null,
          airline: f.airline || null,
          stops: f.stops ?? 0,
          seats: f.seats || null,
          apiSource: f.apiSource || 'amadeus',
        }))
      );
    }
  } catch (err) {
    console.log(`⚠️ Amadeus flight fetch error: ${err.message}`);
  }

  // ── 2. Try Amadeus/Indian-Rail trains ──
  try {
    const trains = await searchTrains({ source, destination });
    if (trains && trains.length > 0) {
      console.log(`✅ Train search returned ${trains.length} option(s)`);
      results.push(
        ...trains.map((t) => ({
          mode: 'train',
          provider: t.provider || 'Indian Railways',
          class: t.class || 'SL',
          totalCost: t.totalCost || t.price,
          duration: t.duration || 'N/A',
          departure: t.departure || null,
          arrival: t.arrival || null,
          trainNumber: t.trainNumber || null,
          trainName: t.trainName || null,
          apiSource: t.apiSource || 'fallback',
        }))
      );
    }
  } catch (err) {
    console.log(`⚠️ Train fetch error: ${err.message}`);
  }

  // ── 3. Fall back to DB if both APIs returned nothing ──
  if (results.length === 0) {
    try {
      const dbOptions = await Transport.getRouteOptions(source, destination);
      results.push(
        ...dbOptions.map((transport) => ({
          mode: transport.mode,
          provider: transport.provider?.name || 'N/A',
          class: transport.class,
          totalCost: transport.pricing.total || transport.pricing.basePrice,
          duration: `${transport.schedule?.duration?.hours || 0}h ${transport.schedule?.duration?.minutes || 0}m`,
          departure: transport.schedule?.departure,
          arrival: transport.schedule?.arrival,
          amenities: transport.amenities,
          _id: transport._id,
          apiSource: 'database',
        }))
      );
    } catch (error) {
      console.error('Error fetching transport from DB:', error);
    }
  }

  return results;
};

/**
 * Get estimated transport costs (fallback if database is empty)
 * @param {string} source
 * @param {string} destination
 * @returns {Array}
 */
const getEstimatedTransportCosts = (source, destination) => {
  // Simplified distance estimation (in real app, use geocoding API)
  const estimatedDistance = 500; // km (placeholder)

  return [
    {
      mode: 'bus',
      provider: 'Government Bus',
      class: 'ac',
      totalCost: Math.round(estimatedDistance * 1.5), // ₹1.5 per km
      duration: `${Math.round(estimatedDistance / 50)}h 0m`,
    },
    {
      mode: 'train',
      provider: 'Indian Railways',
      class: 'sleeper',
      totalCost: Math.round(estimatedDistance * 0.8), // ₹0.8 per km
      duration: `${Math.round(estimatedDistance / 60)}h 0m`,
    },
    {
      mode: 'train',
      provider: 'Indian Railways',
      class: '3ac',
      totalCost: Math.round(estimatedDistance * 1.2),
      duration: `${Math.round(estimatedDistance / 60)}h 0m`,
    },
    {
      mode: 'flight',
      provider: 'Budget Airline',
      class: 'economy',
      totalCost: Math.round(estimatedDistance * 5), // ₹5 per km
      duration: `${Math.round(estimatedDistance / 600)}h 30m`,
    },
  ];
};

/**
 * Calculate trip duration based on remaining budget
 * @param {number} remainingBudget
 * @param {string} destination
 * @returns {object} {days, nights}
 */
const calculateTripDuration = (remainingBudget, destination) => {
  // Estimate minimum daily cost (accommodation + food + local transport)
  const minDailyCost = 1000; // ₹1000 per day minimum

  let nights = Math.floor(remainingBudget / minDailyCost);

  // Minimum 1 night, maximum 7 nights
  nights = Math.max(1, Math.min(nights, 7));

  return {
    days: nights + 1,
    nights: nights,
  };
};

/**
 * Allocate budget across categories
 * @param {number} totalBudget
 * @param {number} transportCost
 * @param {number} nights
 * @param {number} travelers
 * @returns {object} Budget breakdown
 */
const allocateBudget = (totalBudget, transportCost, nights, travelers = 1) => {
  const remainingAfterTransport = totalBudget - transportCost;

  // Allocation percentages
  const accommodationPercentage = 0.4; // 40%
  const foodPercentage = 0.3; // 30%
  const localTransportPercentage = 0.2; // 20%
  const activitiesPercentage = 0.1; // 10%

  const accommodationBudget = remainingAfterTransport * accommodationPercentage;
  const foodBudget = remainingAfterTransport * foodPercentage;
  const localTransportBudget = remainingAfterTransport * localTransportPercentage;
  const activitiesBudget = remainingAfterTransport * activitiesPercentage;

  return {
    transport: {
      allocated: transportCost,
      spent: transportCost,
    },
    accommodation: {
      allocated: Math.round(accommodationBudget),
      perNight: Math.round(accommodationBudget / nights / travelers),
      nights: nights,
      percentage: accommodationPercentage * 100,
    },
    food: {
      allocated: Math.round(foodBudget),
      perDay: Math.round(foodBudget / (nights + 1) / travelers),
      percentage: foodPercentage * 100,
    },
    localTransport: {
      allocated: Math.round(localTransportBudget),
      perDay: Math.round(localTransportBudget / (nights + 1)),
      percentage: localTransportPercentage * 100,
    },
    activities: {
      allocated: Math.round(activitiesBudget),
      percentage: activitiesPercentage * 100,
    },
    totalAllocated: totalBudget,
    remainingBudget: 0,
  };
};

/**
 * Find accommodation within budget
 * @param {string} city
 * @param {number} budgetPerNight
 * @param {number} nights
 * @returns {Promise<object>}
 */
const findAccommodation = async (city, budgetPerNight, nights) => {
  // ── 1. Try Amadeus hotels ──
  try {
    const amadeusHotels = await searchHotels({ cityCode: city, checkInDate: null, checkOutDate: null });
    if (amadeusHotels && amadeusHotels.length > 0) {
      // Pick the cheapest hotel within budget (or closest to budget)
      const affordable = amadeusHotels
        .filter(h => h.pricePerNight <= budgetPerNight * 1.3) // Allow 30% over
        .sort((a, b) => a.pricePerNight - b.pricePerNight);
      const chosen = affordable[0] || amadeusHotels.sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
      if (chosen) {
        return {
          name: chosen.name,
          type: chosen.type || 'hotel',
          rating: chosen.rating || 3,
          pricePerNight: Math.round(chosen.pricePerNight),
          totalCost: Math.round(chosen.pricePerNight * nights),
          location: typeof chosen.location === 'object' ? (chosen.location.address || chosen.location.city) : chosen.location,
          amenities: chosen.amenities?.slice(0, 5) || ['WiFi', 'AC'],
          checkIn: chosen.checkIn || null,
          checkOut: chosen.checkOut || null,
          apiSource: chosen.apiSource || 'amadeus',
        };
      }
    }
  } catch (err) {
    console.log(`⚠️ Amadeus hotel search error: ${err.message}`);
  }

  // ── 2. Fall back to DB ──
  try {
    const hotels = await Hotel.findByBudget(city, budgetPerNight, 3);
    if (hotels && hotels.length > 0) {
      const hotel = hotels[0];
      return {
        name: hotel.name,
        type: hotel.type,
        rating: hotel.userRating?.average || hotel.starRating,
        pricePerNight: hotel.pricing.pricePerNight,
        totalCost: hotel.pricing.pricePerNight * nights,
        location: hotel.location.area || hotel.location.city,
        amenities: hotel.amenities?.basic?.slice(0, 5) || [],
        _id: hotel._id,
        apiSource: 'database',
      };
    }
  } catch (error) {
    console.error('Error finding accommodation in DB:', error);
  }

  // ── 3. Estimated fallback ──
  return {
    name: `Budget Hotel - ${city}`,
    type: 'hotel',
    rating: 3,
    pricePerNight: budgetPerNight,
    totalCost: budgetPerNight * nights,
    location: city,
    amenities: ['WiFi', 'AC', 'Clean Rooms'],
    estimated: true,
    apiSource: 'estimated',
  };
};

/**
 * Get restaurant recommendations
 * @param {string} city
 * @param {number} dailyBudget
 * @returns {Promise<Array>}
 */
const getRestaurantRecommendations = async (city, dailyBudget) => {
  // City-specific curated restaurants (always available, no DB needed)
  const cityRestaurants = {
    mumbai: [
      { name: 'Trishna', cuisine: 'Seafood, Indian', rating: 4.5, averageCost: Math.round(dailyBudget * 0.4) },
      { name: 'Bademiya', cuisine: 'Street Food, Kebabs', rating: 4.3, averageCost: Math.round(dailyBudget * 0.2) },
      { name: 'Cafe Mondegar', cuisine: 'Continental, Fast Food', rating: 4.1, averageCost: Math.round(dailyBudget * 0.3) },
    ],
    delhi: [
      { name: 'Karim\'s', cuisine: 'Mughlai, Indian', rating: 4.4, averageCost: Math.round(dailyBudget * 0.3) },
      { name: 'Paranthe Wali Gali', cuisine: 'Street Food, Indian', rating: 4.2, averageCost: Math.round(dailyBudget * 0.15) },
      { name: 'Indian Accent', cuisine: 'Modern Indian', rating: 4.7, averageCost: Math.round(dailyBudget * 0.5) },
    ],
    jaipur: [
      { name: 'Laxmi Misthan Bhandar', cuisine: 'Rajasthani, Sweets', rating: 4.3, averageCost: Math.round(dailyBudget * 0.2) },
      { name: 'Suvarna Mahal', cuisine: 'Royal Rajasthani', rating: 4.5, averageCost: Math.round(dailyBudget * 0.5) },
      { name: '1135 AD', cuisine: 'Rajasthani, Indian', rating: 4.4, averageCost: Math.round(dailyBudget * 0.4) },
    ],
    goa: [
      { name: 'Vinayak Family Restaurant', cuisine: 'Goan, Seafood', rating: 4.3, averageCost: Math.round(dailyBudget * 0.3) },
      { name: 'Britto\'s', cuisine: 'Seafood, Continental', rating: 4.2, averageCost: Math.round(dailyBudget * 0.35) },
      { name: 'Gunpowder', cuisine: 'South Indian, Kerala', rating: 4.4, averageCost: Math.round(dailyBudget * 0.3) },
    ],
    bangalore: [
      { name: 'Vidyarthi Bhavan', cuisine: 'South Indian', rating: 4.4, averageCost: Math.round(dailyBudget * 0.15) },
      { name: 'Toit Brewpub', cuisine: 'Continental, Pub', rating: 4.3, averageCost: Math.round(dailyBudget * 0.4) },
      { name: 'Koshy\'s', cuisine: 'Continental, Indian', rating: 4.2, averageCost: Math.round(dailyBudget * 0.3) },
    ],
    bengaluru: [
      { name: 'Vidyarthi Bhavan', cuisine: 'South Indian', rating: 4.4, averageCost: Math.round(dailyBudget * 0.15) },
      { name: 'Toit Brewpub', cuisine: 'Continental, Pub', rating: 4.3, averageCost: Math.round(dailyBudget * 0.4) },
      { name: 'Koshy\'s', cuisine: 'Continental, Indian', rating: 4.2, averageCost: Math.round(dailyBudget * 0.3) },
    ],
    kolkata: [
      { name: 'Peter Cat', cuisine: 'Continental, Indian', rating: 4.3, averageCost: Math.round(dailyBudget * 0.35) },
      { name: 'Kewpie\'s Kitchen', cuisine: 'Bengali', rating: 4.4, averageCost: Math.round(dailyBudget * 0.3) },
      { name: 'Arsalan', cuisine: 'Mughlai, Biryani', rating: 4.5, averageCost: Math.round(dailyBudget * 0.25) },
    ],
    hyderabad: [
      { name: 'Paradise Biryani', cuisine: 'Hyderabadi, Biryani', rating: 4.5, averageCost: Math.round(dailyBudget * 0.25) },
      { name: 'Bawarchi', cuisine: 'Biryani, Hyderabadi', rating: 4.3, averageCost: Math.round(dailyBudget * 0.2) },
      { name: 'Shah Ghouse', cuisine: 'Haleem, Biryani', rating: 4.4, averageCost: Math.round(dailyBudget * 0.2) },
    ],
    chennai: [
      { name: 'Murugan Idli Shop', cuisine: 'South Indian', rating: 4.4, averageCost: Math.round(dailyBudget * 0.15) },
      { name: 'Annalakshmi', cuisine: 'South Indian', rating: 4.3, averageCost: Math.round(dailyBudget * 0.25) },
      { name: 'Ponnusamy Hotel', cuisine: 'Chettinad', rating: 4.2, averageCost: Math.round(dailyBudget * 0.3) },
    ],
  };

  const key = city.toLowerCase();
  const curated = cityRestaurants[key];
  if (curated) return curated;

  // Generic fallback for unlisted cities
  return [
    { name: `Local Dhaba - ${city}`, cuisine: 'Indian, Street Food', rating: 3.8, averageCost: Math.round(dailyBudget * 0.2) },
    { name: `${city} Restaurant`, cuisine: 'Multi-cuisine', rating: 4.0, averageCost: Math.round(dailyBudget * 0.35) },
    { name: `Budget Meals - ${city}`, cuisine: 'Indian', rating: 3.9, averageCost: Math.round(dailyBudget * 0.15) },
  ];
};

/**
 * Get estimated restaurants (fallback)
 */
const getEstimatedRestaurants = (city, dailyBudget) => {
  return [
    {
      name: 'Local Dhaba',
      cuisine: 'Indian',
      priceRange: '$',
      rating: 3.8,
      estimatedCost: Math.round(dailyBudget * 0.3),
    },
    {
      name: 'Popular Restaurant',
      cuisine: 'Multi-cuisine',
      priceRange: '$$',
      rating: 4.0,
      estimatedCost: Math.round(dailyBudget * 0.4),
    },
  ];
};

/**
 * Get local transport suggestions
 */
const getLocalTransportSuggestions = (dailyBudget) => {
  const suggestions = [
    {
      mode: 'Auto Rickshaw',
      estimatedDailyCost: Math.round(dailyBudget * 0.4),
      details: 'Convenient for short distances',
    },
    {
      mode: 'Metro / Bus',
      estimatedDailyCost: Math.round(dailyBudget * 0.3),
      details: 'Most economical option',
    },
  ];

  if (dailyBudget > 300) {
    suggestions.push({
      mode: 'Cab / Uber',
      estimatedDailyCost: Math.round(dailyBudget * 0.6),
      details: 'Comfortable for full day',
    });
  }

  return suggestions;
};

/**
 * Get attraction suggestions with real city data
 */
const getAttractionSuggestions = (city, budget) => {
  const cityAttractions = {
    mumbai: [
      { name: 'Gateway of India', type: 'Monument', estimatedCost: 0, rating: 4.6, timings: 'All day' },
      { name: 'Marine Drive', type: 'Promenade', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Elephanta Caves', type: 'Heritage', estimatedCost: 40, rating: 4.3, timings: '9 AM - 5:30 PM' },
      { name: 'Chhatrapati Shivaji Terminus', type: 'Heritage', estimatedCost: 0, rating: 4.6, timings: 'All day' },
    ],
    delhi: [
      { name: 'Red Fort', type: 'Monument', estimatedCost: 35, rating: 4.4, timings: '9:30 AM - 4:30 PM' },
      { name: 'Qutub Minar', type: 'Monument', estimatedCost: 35, rating: 4.5, timings: '7 AM - 5 PM' },
      { name: 'India Gate', type: 'Monument', estimatedCost: 0, rating: 4.6, timings: 'All day' },
      { name: 'Humayun\'s Tomb', type: 'Heritage', estimatedCost: 35, rating: 4.5, timings: '6 AM - 6 PM' },
    ],
    jaipur: [
      { name: 'Amber Fort', type: 'Fort', estimatedCost: 100, rating: 4.6, timings: '8 AM - 5:30 PM' },
      { name: 'Hawa Mahal', type: 'Palace', estimatedCost: 50, rating: 4.5, timings: '9 AM - 4:30 PM' },
      { name: 'City Palace', type: 'Palace', estimatedCost: 200, rating: 4.5, timings: '9:30 AM - 5 PM' },
      { name: 'Jantar Mantar', type: 'Observatory', estimatedCost: 50, rating: 4.3, timings: '9 AM - 4:30 PM' },
    ],
    goa: [
      { name: 'Calangute Beach', type: 'Beach', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Basilica of Bom Jesus', type: 'Church', estimatedCost: 0, rating: 4.6, timings: '9 AM - 6:30 PM' },
      { name: 'Fort Aguada', type: 'Fort', estimatedCost: 0, rating: 4.4, timings: '9:30 AM - 6 PM' },
      { name: 'Dudhsagar Falls', type: 'Waterfall', estimatedCost: 400, rating: 4.6, timings: '6 AM - 6 PM' },
    ],
    bangalore: [
      { name: 'Lalbagh Botanical Garden', type: 'Garden', estimatedCost: 20, rating: 4.4, timings: '6 AM - 7 PM' },
      { name: 'Cubbon Park', type: 'Park', estimatedCost: 0, rating: 4.4, timings: '6 AM - 6 PM' },
      { name: 'Bangalore Palace', type: 'Palace', estimatedCost: 230, rating: 4.2, timings: '10 AM - 5:30 PM' },
      { name: 'ISKCON Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '7:15 AM - 8:30 PM' },
    ],
    bengaluru: [
      { name: 'Lalbagh Botanical Garden', type: 'Garden', estimatedCost: 20, rating: 4.4, timings: '6 AM - 7 PM' },
      { name: 'Cubbon Park', type: 'Park', estimatedCost: 0, rating: 4.4, timings: '6 AM - 6 PM' },
      { name: 'Bangalore Palace', type: 'Palace', estimatedCost: 230, rating: 4.2, timings: '10 AM - 5:30 PM' },
      { name: 'ISKCON Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '7:15 AM - 8:30 PM' },
    ],
    kolkata: [
      { name: 'Victoria Memorial', type: 'Monument', estimatedCost: 30, rating: 4.6, timings: '10 AM - 5 PM' },
      { name: 'Howrah Bridge', type: 'Bridge', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Indian Museum', type: 'Museum', estimatedCost: 20, rating: 4.3, timings: '10 AM - 5 PM' },
      { name: 'Dakshineswar Kali Temple', type: 'Temple', estimatedCost: 0, rating: 4.7, timings: '6 AM - 12:30 PM, 3 PM - 9 PM' },
    ],
    hyderabad: [
      { name: 'Charminar', type: 'Monument', estimatedCost: 25, rating: 4.4, timings: '9:30 AM - 5:30 PM' },
      { name: 'Golconda Fort', type: 'Fort', estimatedCost: 15, rating: 4.5, timings: '8 AM - 5:30 PM' },
      { name: 'Ramoji Film City', type: 'Theme Park', estimatedCost: 1150, rating: 4.4, timings: '9 AM - 5:30 PM' },
      { name: 'Hussain Sagar Lake', type: 'Lake', estimatedCost: 0, rating: 4.3, timings: 'All day' },
    ],
    chennai: [
      { name: 'Marina Beach', type: 'Beach', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Kapaleeshwarar Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '5 AM - 12 PM, 4 PM - 9 PM' },
      { name: 'Fort St. George', type: 'Fort', estimatedCost: 5, rating: 4.2, timings: '9 AM - 5 PM' },
      { name: 'Government Museum', type: 'Museum', estimatedCost: 15, rating: 4.2, timings: '9:30 AM - 5 PM' },
    ],
  };

  const key = city.toLowerCase();
  return cityAttractions[key] || [
    { name: `${city} Heritage Walk`, type: 'Sightseeing', estimatedCost: 0, rating: 4.2, timings: 'All day' },
    { name: `${city} Local Market`, type: 'Market', estimatedCost: 0, rating: 4.0, timings: '10 AM - 8 PM' },
    { name: `${city} Museum`, type: 'Museum', estimatedCost: Math.min(50, Math.round(budget * 0.1)), rating: 4.1, timings: '10 AM - 5 PM' },
  ];
};

/**
 * Handle low budget scenario with alternatives
 */
const handleLowBudgetScenario = ({
  source,
  destination,
  totalBudget,
  numberOfTravelers,
  cheapestTransport,
}) => {
  const minBudgetRequired = cheapestTransport.totalCost * numberOfTravelers * 3; // 3x transport cost

  return {
    isOptimized: false,
    optimizationScore: 0,
    transport: null,
    accommodation: null,
    budgetBreakdown: null,
    recommendations: {},
    optimizationNotes: [
      {
        type: 'warning',
        message: `Budget of ₹${totalBudget} is too low for this trip`,
      },
      {
        type: 'suggestion',
        message: `Minimum recommended budget: ₹${minBudgetRequired}`,
      },
    ],
    alternativePlan: {
      hasAlternative: true,
      suggestedBudget: minBudgetRequired,
      suggestedDuration: '2 days, 1 night',
      alternatives: [
        {
          option: 'Increase Budget',
          description: `Consider increasing budget to at least ₹${minBudgetRequired}`,
        },
        {
          option: 'Choose Nearby Destination',
          description: 'Select a destination closer to reduce transport costs',
        },
        {
          option: 'Travel by Bus/Train',
          description: 'Choose cheaper transport options like sleeper class',
        },
      ],
    },
  };
};

/**
 * Calculate optimization score
 */
const calculateOptimizationScore = ({
  budgetUtilization,
  transportCost,
  hasAccommodation,
  numberOfOptions,
}) => {
  let score = 0;

  // Budget utilization (40 points)
  if (budgetUtilization >= 85 && budgetUtilization <= 100) {
    score += 40;
  } else if (budgetUtilization >= 70) {
    score += 30;
  } else {
    score += 20;
  }

  // Has accommodation (30 points)
  score += hasAccommodation ? 30 : 10;

  // Multiple options available (20 points)
  score += Math.min(numberOfOptions * 5, 20);

  // Transport affordability (10 points)
  score += 10;

  return Math.min(score, 100);
};

module.exports = {
  optimizeTripBudget,
  fetchTransportOptions,
  calculateTripDuration,
  allocateBudget,
  findAccommodation,
  getRestaurantRecommendations,
  handleLowBudgetScenario,
};
