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
const logger = require('./logger');

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
  numberOfDays,
}) => {
  try {
    const optimizationResult = {
      isOptimized: false,
      optimizationScore: 0,
      transport: null,
      alternativeTransports: [], // Added for showing other rail options
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
    logger.debug(`Searching transport from ${source} to ${destination}...`);

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

    // ========== STEP 2: Sort — smart priority for long-distance routes ==========
    // For long-distance routes (Delhi-Mumbai, etc), prioritize: flights > trains > buses
    // For short routes: price is the main factor
    const majorCities = ['delhi', 'patna', 'mumbai', 'bangalore', 'hyderabad', 'kolkata', 'goa', 'jaipur', 'pune', 'chandigarh'];
    const routeKey = `${(source || '').toLowerCase()}-${(destination || '').toLowerCase()}`;
    const isLongDistance = majorCities.some(city => 
      routeKey.includes(city) && routeKey.split('-').length === 2 && 
      routeKey.split('-')[0] !== routeKey.split('-')[1]
    );

    transportOptions.sort((a, b) => {
      // Priority 1: Real API data first
      const aReal = a.apiSource === 'amadeus' || a.apiSource === 'indian_railway' || a.apiSource === 'database';
      const bReal = b.apiSource === 'amadeus' || b.apiSource === 'indian_railway' || b.apiSource === 'database';
      if (aReal && !bReal) return -1;
      if (!aReal && bReal) return 1;

      // Priority 2: For long distances, prefer flights, then trains, then buses
      if (isLongDistance) {
        const modeOrder = { 'flight': 0, 'train': 1, 'bus': 2, 'shared-auto': 3, 'rickshaw': 4, 'walk': 5 };
        const aOrder = modeOrder[a.mode] ?? 99;
        const bOrder = modeOrder[b.mode] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
      }

      // Priority 3: Sort by price
      return a.totalCost - b.totalCost;
    });

    // ========== STEP 3: Find Affordable Transport ==========
    let selectedTransport = null;
    let remainingBudget = 0;
    let budgetMode = 'normal'; // 'normal' | 'tight' | 'ultra'

    // Determine budget threshold based on route and mode preference
    let transportBudgetThreshold = 0.70; // 70% by default
    
    // For long-distance routes with real API options (flights/trains), allow up to 50% for better comfort
    const hasRealOptions = transportOptions.some(t => 
      t.apiSource === 'amadeus' || t.apiSource === 'indian_railway' || t.apiSource === 'database'
    );
    if (isLongDistance && hasRealOptions) {
      transportBudgetThreshold = 0.50; // Allow 50% for long-distance flights/trains
    }

    // Pass 1: Standard — allow reasonable % of budget for transport
    for (const transport of transportOptions) {
      const transportCost = transport.totalCost * numberOfTravelers;
      if (transportCost <= totalBudget * transportBudgetThreshold) {
        selectedTransport = transport;
        remainingBudget = totalBudget - transportCost;
        budgetMode = 'normal';
        logger.debug(`Selected ${transport.mode}: ₹${transport.totalCost} (${Math.round((transportCost/totalBudget)*100)}% of budget)`);
        break;
      }
    }

    // Pass 2: Tight budget — allow up to 70% for transport; use free food/accommodation
    if (!selectedTransport) {
      for (const transport of transportOptions) {
        const transportCost = transport.totalCost * numberOfTravelers;
        if (transportCost <= totalBudget * 0.7) {
          selectedTransport = transport;
          remainingBudget = totalBudget - transportCost;
          budgetMode = 'tight';
          logger.debug(`Tight budget — Selected ${transport.mode}: ₹${transport.totalCost}`);
          break;
        }
      }
    }

    // Pass 3: Tight-tight budget — allow up to 100% for transport
    if (!selectedTransport) {
      for (const transport of transportOptions) {
        const transportCost = transport.totalCost * numberOfTravelers;
        if (transportCost <= totalBudget) {
          selectedTransport = transport;
          remainingBudget = Math.max(0, totalBudget - transportCost);
          budgetMode = 'tight';
          logger.debug(`Very tight budget — Selected ${transport.mode}: ₹${transport.totalCost}`);
          break;
        }
      }
    }

    // Pass 4: Ultra mode — use cheapest available, rely entirely on free resources
    if (!selectedTransport) {
      const sortedByPrice = [...transportOptions].sort((a, b) => a.totalCost - b.totalCost);
      if (sortedByPrice.length > 0) {
        selectedTransport = sortedByPrice[0];
        remainingBudget = 0;
        budgetMode = 'ultra';
        logger.debug(`Ultra-low budget — Selected cheapest: ${selectedTransport.mode} ₹${selectedTransport.totalCost}`);
      }
    }

    // Ultra/impossible mode: build community-resource plan
    if (!selectedTransport || budgetMode === 'ultra') {
      logger.debug('Ultra-low budget — building community-resource plan');
      return handleLowBudgetScenario({
        source,
        destination,
        totalBudget,
        numberOfTravelers,
        numberOfDays,
        cheapestTransport: selectedTransport || transportOptions[0] || null,
      });
    }

    optimizationResult.transport = selectedTransport;

    // ========== ADD STEP 3.5: Collect Alternative Transport Options ==========
    // Show flights, trains, and buses as alternatives based on what was selected
    let alternativeTransports = [];
    
    // If train was selected, show flight and bus alternatives
    if (selectedTransport.mode === 'train' || selectedTransport.apiSource === 'indian_railway') {
      alternativeTransports = transportOptions
        .filter(t => {
          // Show flights and buses as alternatives to trains
          if (t.mode === 'flight' && t.totalCost * numberOfTravelers <= totalBudget) {
            return true;
          }
          if (t.mode === 'bus' && t.totalCost !== selectedTransport.totalCost) {
            return true;
          }
          // Also include other trains with different classes/departure times
          if (t.mode === 'train' && t.trainNumber !== selectedTransport.trainNumber) {
            return true;
          }
          return false;
        })
        .slice(0, 5); // Top 5 alternatives
    }
    // If flight was selected, show train and bus alternatives
    else if (selectedTransport.mode === 'flight' || selectedTransport.apiSource === 'amadeus') {
      alternativeTransports = transportOptions
        .filter(t => {
          // Show trains and buses as budget alternatives to flights
          if ((t.mode === 'train' || t.mode === 'bus') && t.totalCost * numberOfTravelers <= totalBudget * 0.7) {
            return true;
          }
          return false;
        })
        .sort((a, b) => a.totalCost - b.totalCost)
        .slice(0, 5); // Top 5 budget alternatives
    }
    
    if (alternativeTransports.length > 0) {
      logger.debug(`Found ${alternativeTransports.length} alternative transport options`);
      optimizationResult.alternativeTransports = alternativeTransports;
    }

    if (budgetMode === 'tight') {
      optimizationResult.optimizationNotes.push({
        type: 'warning',
        message: `Tight budget detected. Free langar/temple meals and dharamshala stays recommended to stretch your trip.`,
      });
    }

    // Add explanation for transport selection
    const transportCostPercent = Math.round((selectedTransport.totalCost * numberOfTravelers / totalBudget) * 100);
    
    if (isLongDistance) {
      // Check if flights were available but not affordable
      const availableFlights = transportOptions.filter(t => t.mode === 'flight' && t.apiSource === 'amadeus');
      if (availableFlights.length > 0 && selectedTransport.mode !== 'flight') {
        const cheapestFlight = availableFlights.sort((a, b) => a.totalCost - b.totalCost)[0];
        const flightCost = cheapestFlight.totalCost * numberOfTravelers;
        const trainCost = selectedTransport.totalCost * numberOfTravelers;
        
        optimizationResult.optimizationNotes.push({
          type: 'info',
          message: `Selected ${selectedTransport.mode} (₹${trainCost}) over available flights (₹${flightCost}) to stay within budget. Budget allows ${transportCostPercent}% for transport.`,
        });
        optimizationResult.optimizationNotes.push({
          type: 'suggestion',
          message: `💡 Tip: Check for flight deals or consider increasing budget to ₹${Math.round((flightCost / 0.5) + 1000)} for a more comfortable journey.`,
        });
      } else if (selectedTransport.mode === 'flight') {
        optimizationResult.optimizationNotes.push({
          type: 'success',
          message: `Great! Your budget allows for a comfortable flight option (${transportCostPercent}% of budget).`,
        });
      } else {
        optimizationResult.optimizationNotes.push({
          type: 'info',
          message: `Selected budget-friendly ${selectedTransport.mode} (₹${selectedTransport.totalCost * numberOfTravelers}) for your long-distance journey.`,
        });
      }
    } else {
      optimizationResult.optimizationNotes.push({
        type: 'info',
        message: `Selected ${selectedTransport.mode} as the most suitable option for this route.`,
      });
    }

    // ========== STEP 4: Calculate Duration Based on Budget or User Input ==========
    let tripDuration;
    if (numberOfDays && numberOfDays >= 1) {
      const nights = Math.max(0, numberOfDays - 1);
      tripDuration = { days: numberOfDays, nights };
      optimizationResult.optimizationNotes.push({
        type: 'info',
        message: `Trip planned for ${numberOfDays} day${numberOfDays > 1 ? 's' : ''} (${nights} night${nights !== 1 ? 's' : ''}) as requested.`,
      });
    } else {
      tripDuration = calculateTripDuration(remainingBudget, destination);
    }

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

    // ========== STEP 7.5: Always include free food sources ==========
    const freeFoodSources = getFreeFoodSources(destination);
    optimizationResult.recommendations.freeFoodSources = freeFoodSources;

    // For tight-budget trips (food < ₹200/day), prepend free options to restaurant list
    if (budgetBreakdown.food.perDay < 200 && freeFoodSources.length > 0) {
      const freeOptions = freeFoodSources.slice(0, 2).map((f) => ({
        name: f.name,
        cuisine: `${f.type} — FREE`,
        rating: 4.5,
        averageCost: 0,
        address: f.address,
        timings: f.timings,
        isFree: true,
        note: f.note,
      }));
      optimizationResult.recommendations.restaurants = [
        ...freeOptions,
        ...optimizationResult.recommendations.restaurants,
      ];
      optimizationResult.optimizationNotes.push({
        type: 'tip',
        message: `Free meals available at ${freeFoodSources[0].name} (${freeFoodSources[0].timings}). No charges, no questions asked.`,
      });
    }

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
    logger.error(`Optimization Error: ${error.message}`);
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
  // Ultra-budget (< ₹1000 left): ₹200/day using langar food + rickshaw transport
  // Standard: ₹1000/day with paid accommodation + meals
  const minDailyCost = remainingBudget < 1000 ? 200 : 1000;

  if (remainingBudget < minDailyCost) {
    // Day trip — travel and back in same day, rely on free resources
    return { days: 1, nights: 0 };
  }

  let nights = Math.floor(remainingBudget / minDailyCost);
  nights = Math.max(1, Math.min(nights, 7));

  return {
    days: nights + 1,
    nights,
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
 * Get local transport suggestions.
 * Always starts with the cheapest options: cycle rickshaw, shared-auto, city bus.
 * TODO: Replace estimated fares with real per-city localFareDB lookup when available.
 */
const getLocalTransportSuggestions = (dailyBudget) => {
  const budget = dailyBudget || 50; // default ₹50 minimum

  const suggestions = [
    {
      mode: 'Cycle Rickshaw',
      estimatedDailyCost: Math.max(20, Math.round(budget * 0.15)),
      details: 'Cheapest option for distances under 3 km. Negotiate fare before boarding.',
      fareEstimate: '₹10–20 per km',
      icon: '🛺',
    },
    {
      mode: 'Shared Auto Rickshaw',
      estimatedDailyCost: Math.max(30, Math.round(budget * 0.2)),
      details: 'Fixed routes, shared with other passengers. Very economical.',
      fareEstimate: '₹5–8 per km (shared)',
      icon: '🛺',
    },
    {
      mode: 'City / State Bus',
      estimatedDailyCost: Math.max(15, Math.round(budget * 0.1)),
      details: 'Most economical. Covers most city and intercity routes.',
      fareEstimate: '₹1–3 per km',
      icon: '🚌',
    },
    {
      mode: 'Auto Rickshaw (metered)',
      estimatedDailyCost: Math.max(80, Math.round(budget * 0.4)),
      details: 'Always insist on meter. Good for medium distances under 10 km.',
      fareEstimate: '₹15–25 per km',
      icon: '🛺',
    },
  ];

  if (budget > 150) {
    suggestions.push({
      mode: 'Metro / Local Train',
      estimatedDailyCost: Math.round(budget * 0.25),
      details: 'Available in major cities (Delhi, Mumbai, Bangalore, Hyderabad, Chennai). Fast and reliable.',
      fareEstimate: '₹10–50 per trip',
      icon: '🚇',
    });
  }

  if (budget > 400) {
    suggestions.push({
      mode: 'Cab / Uber / Ola',
      estimatedDailyCost: Math.round(budget * 0.6),
      details: 'Comfortable for full-day sightseeing. Book in advance for best rates.',
      fareEstimate: '₹12–20 per km',
      icon: '🚕',
    });
  }

  return suggestions;
};

/**
 * Get attraction suggestions with real city data
 */
const getAttractionSuggestions = (city, activitiesBudget) => {
  const cityAttractions = {
    // ── Metro Cities ──────────────────────────────────────────────────────────
    mumbai: [
      { name: 'Gateway of India', type: 'Monument', estimatedCost: 0, rating: 4.6, timings: 'All day' },
      { name: 'Marine Drive', type: 'Promenade', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Elephanta Caves', type: 'Heritage', estimatedCost: 40, rating: 4.3, timings: '9 AM - 5:30 PM' },
      { name: 'Chhatrapati Shivaji Terminus', type: 'Heritage', estimatedCost: 0, rating: 4.6, timings: 'All day' },
      { name: 'Juhu Beach', type: 'Beach', estimatedCost: 0, rating: 4.1, timings: 'All day' },
    ],
    delhi: [
      { name: 'Red Fort', type: 'Monument', estimatedCost: 35, rating: 4.4, timings: '9:30 AM - 4:30 PM' },
      { name: 'Qutub Minar', type: 'Monument', estimatedCost: 35, rating: 4.5, timings: '7 AM - 5 PM' },
      { name: 'India Gate', type: 'Monument', estimatedCost: 0, rating: 4.6, timings: 'All day' },
      { name: "Humayun's Tomb", type: 'Heritage', estimatedCost: 35, rating: 4.5, timings: '6 AM - 6 PM' },
      { name: 'Lotus Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '9 AM - 5:30 PM' },
      { name: 'Chandni Chowk', type: 'Market', estimatedCost: 0, rating: 4.3, timings: '9 AM - 9 PM' },
    ],
    'new delhi': [
      { name: 'Red Fort', type: 'Monument', estimatedCost: 35, rating: 4.4, timings: '9:30 AM - 4:30 PM' },
      { name: 'Qutub Minar', type: 'Monument', estimatedCost: 35, rating: 4.5, timings: '7 AM - 5 PM' },
      { name: 'India Gate', type: 'Monument', estimatedCost: 0, rating: 4.6, timings: 'All day' },
      { name: "Humayun's Tomb", type: 'Heritage', estimatedCost: 35, rating: 4.5, timings: '6 AM - 6 PM' },
      { name: 'Lotus Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '9 AM - 5:30 PM' },
      { name: 'Chandni Chowk', type: 'Market', estimatedCost: 0, rating: 4.3, timings: '9 AM - 9 PM' },
    ],
    kolkata: [
      { name: 'Victoria Memorial', type: 'Monument', estimatedCost: 30, rating: 4.6, timings: '10 AM - 5 PM' },
      { name: 'Howrah Bridge', type: 'Bridge', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Indian Museum', type: 'Museum', estimatedCost: 20, rating: 4.3, timings: '10 AM - 5 PM' },
      { name: 'Dakshineswar Kali Temple', type: 'Temple', estimatedCost: 0, rating: 4.7, timings: '6 AM - 12:30 PM, 3 PM - 9 PM' },
      { name: 'College Street', type: 'Market', estimatedCost: 0, rating: 4.2, timings: '10 AM - 8 PM' },
    ],
    bangalore: [
      { name: 'Lalbagh Botanical Garden', type: 'Garden', estimatedCost: 20, rating: 4.4, timings: '6 AM - 7 PM' },
      { name: 'Cubbon Park', type: 'Park', estimatedCost: 0, rating: 4.4, timings: '6 AM - 6 PM' },
      { name: 'Bangalore Palace', type: 'Palace', estimatedCost: 230, rating: 4.2, timings: '10 AM - 5:30 PM' },
      { name: 'ISKCON Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '7:15 AM - 8:30 PM' },
      { name: 'Vidhana Soudha', type: 'Monument', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    bengaluru: [
      { name: 'Lalbagh Botanical Garden', type: 'Garden', estimatedCost: 20, rating: 4.4, timings: '6 AM - 7 PM' },
      { name: 'Cubbon Park', type: 'Park', estimatedCost: 0, rating: 4.4, timings: '6 AM - 6 PM' },
      { name: 'Bangalore Palace', type: 'Palace', estimatedCost: 230, rating: 4.2, timings: '10 AM - 5:30 PM' },
      { name: 'ISKCON Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '7:15 AM - 8:30 PM' },
      { name: 'Vidhana Soudha', type: 'Monument', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    chennai: [
      { name: 'Marina Beach', type: 'Beach', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Kapaleeshwarar Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '5 AM - 12 PM, 4 PM - 9 PM' },
      { name: 'Fort St. George', type: 'Fort', estimatedCost: 5, rating: 4.2, timings: '9 AM - 5 PM' },
      { name: 'Government Museum', type: 'Museum', estimatedCost: 15, rating: 4.2, timings: '9:30 AM - 5 PM' },
      { name: 'Mahabalipuram Shore Temple', type: 'Heritage', estimatedCost: 40, rating: 4.6, timings: '6 AM - 6 PM' },
    ],
    hyderabad: [
      { name: 'Charminar', type: 'Monument', estimatedCost: 25, rating: 4.4, timings: '9:30 AM - 5:30 PM' },
      { name: 'Golconda Fort', type: 'Fort', estimatedCost: 15, rating: 4.5, timings: '8 AM - 5:30 PM' },
      { name: 'Hussain Sagar Lake', type: 'Lake', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Salar Jung Museum', type: 'Museum', estimatedCost: 20, rating: 4.3, timings: '10 AM - 5 PM' },
      { name: 'Ramoji Film City', type: 'Theme Park', estimatedCost: 1150, rating: 4.4, timings: '9 AM - 5:30 PM' },
    ],
    // ── Rajasthan ─────────────────────────────────────────────────────────────
    jaipur: [
      { name: 'Amber Fort', type: 'Fort', estimatedCost: 100, rating: 4.6, timings: '8 AM - 5:30 PM' },
      { name: 'Hawa Mahal', type: 'Palace', estimatedCost: 50, rating: 4.5, timings: '9 AM - 4:30 PM' },
      { name: 'City Palace', type: 'Palace', estimatedCost: 200, rating: 4.5, timings: '9:30 AM - 5 PM' },
      { name: 'Jantar Mantar', type: 'Observatory', estimatedCost: 50, rating: 4.3, timings: '9 AM - 4:30 PM' },
      { name: 'Nahargarh Fort', type: 'Fort', estimatedCost: 50, rating: 4.4, timings: '10 AM - 5:30 PM' },
    ],
    udaipur: [
      { name: 'City Palace', type: 'Palace', estimatedCost: 300, rating: 4.6, timings: '9:30 AM - 5:30 PM' },
      { name: 'Lake Pichola Boat Ride', type: 'Lake', estimatedCost: 400, rating: 4.7, timings: '8 AM - 6 PM' },
      { name: 'Saheliyon ki Bari', type: 'Garden', estimatedCost: 10, rating: 4.3, timings: '9 AM - 7 PM' },
      { name: 'Jagdish Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '4 AM - 2 PM, 5 PM - 10 PM' },
      { name: 'Fateh Sagar Lake', type: 'Lake', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    jodhpur: [
      { name: 'Mehrangarh Fort', type: 'Fort', estimatedCost: 100, rating: 4.7, timings: '9 AM - 5 PM' },
      { name: 'Umaid Bhawan Palace Museum', type: 'Palace', estimatedCost: 30, rating: 4.5, timings: '9 AM - 5 PM' },
      { name: 'Jaswant Thada', type: 'Heritage', estimatedCost: 30, rating: 4.4, timings: '9 AM - 5 PM' },
      { name: 'Clock Tower & Sardar Market', type: 'Market', estimatedCost: 0, rating: 4.3, timings: '8 AM - 9 PM' },
    ],
    jaisalmer: [
      { name: 'Jaisalmer Fort', type: 'Fort', estimatedCost: 70, rating: 4.6, timings: '9 AM - 6 PM' },
      { name: 'Sam Sand Dunes', type: 'Dunes', estimatedCost: 500, rating: 4.6, timings: 'Sunrise - Sunset' },
      { name: 'Patwon ki Haveli', type: 'Heritage', estimatedCost: 50, rating: 4.3, timings: '9 AM - 5 PM' },
      { name: 'Gadisar Lake', type: 'Lake', estimatedCost: 0, rating: 4.4, timings: '8 AM - 6 PM' },
    ],
    ajmer: [
      { name: 'Dargah Khwaja Saheb', type: 'Religious', estimatedCost: 0, rating: 4.5, timings: '5 AM - 10 PM' },
      { name: 'Ana Sagar Lake', type: 'Lake', estimatedCost: 0, rating: 4.2, timings: 'All day' },
      { name: 'Taragarh Fort', type: 'Fort', estimatedCost: 0, rating: 4.0, timings: 'All day' },
    ],
    pushkar: [
      { name: 'Brahma Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '6:30 AM - 1:30 PM, 3 PM - 9 PM' },
      { name: 'Pushkar Lake', type: 'Lake', estimatedCost: 0, rating: 4.4, timings: 'All day' },
      { name: 'Savitri Mata Temple', type: 'Temple', estimatedCost: 0, rating: 4.3, timings: '6 AM - 8 PM' },
    ],
    // ── Uttar Pradesh ─────────────────────────────────────────────────────────
    agra: [
      { name: 'Taj Mahal', type: 'Monument', estimatedCost: 50, rating: 4.8, timings: 'Sunrise - Sunset (Fri closed)' },
      { name: 'Agra Fort', type: 'Fort', estimatedCost: 40, rating: 4.5, timings: '6 AM - 6 PM' },
      { name: 'Fatehpur Sikri', type: 'Heritage', estimatedCost: 40, rating: 4.5, timings: '6 AM - 6 PM' },
      { name: 'Mehtab Bagh', type: 'Garden', estimatedCost: 25, rating: 4.4, timings: '6 AM - 6 PM' },
    ],
    varanasi: [
      { name: 'Dashashwamedh Ghat Aarti', type: 'Religious', estimatedCost: 0, rating: 4.8, timings: 'Daily evening' },
      { name: 'Kashi Vishwanath Temple', type: 'Temple', estimatedCost: 0, rating: 4.7, timings: '3 AM - 11 PM' },
      { name: 'Sarnath', type: 'Heritage', estimatedCost: 10, rating: 4.5, timings: '5 AM - 6 PM' },
      { name: 'Boat Ride on Ganges', type: 'Experience', estimatedCost: 150, rating: 4.6, timings: 'Early morning / Sunset' },
      { name: 'Manikarnika Ghat', type: 'Religious', estimatedCost: 0, rating: 4.3, timings: 'All day' },
    ],
    lucknow: [
      { name: 'Bara Imambara', type: 'Heritage', estimatedCost: 25, rating: 4.5, timings: '6 AM - 5 PM' },
      { name: 'Chota Imambara', type: 'Heritage', estimatedCost: 25, rating: 4.4, timings: '6 AM - 5 PM' },
      { name: 'British Residency', type: 'Heritage', estimatedCost: 15, rating: 4.3, timings: '10 AM - 5 PM' },
      { name: 'Hazratganj Market', type: 'Market', estimatedCost: 0, rating: 4.2, timings: '10 AM - 9 PM' },
    ],
    mathura: [
      { name: 'Krishna Janmabhoomi Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '5 AM - 12 PM, 4 PM - 9:30 PM' },
      { name: 'Dwarkadhish Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '6:30 AM - 1 PM, 5 PM - 9:30 PM' },
      { name: 'Vrindavan', type: 'Religious', estimatedCost: 0, rating: 4.6, timings: 'All day' },
    ],
    // ── Himachal Pradesh & Uttarakhand ────────────────────────────────────────
    shimla: [
      { name: 'The Ridge', type: 'Viewpoint', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Mall Road', type: 'Market', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Jakhu Temple', type: 'Temple', estimatedCost: 0, rating: 4.4, timings: '5 AM - 9 PM' },
      { name: 'Kufri', type: 'Hills', estimatedCost: 200, rating: 4.3, timings: '8 AM - 6 PM' },
      { name: 'Christ Church', type: 'Church', estimatedCost: 0, rating: 4.4, timings: '8 AM - 6 PM' },
    ],
    manali: [
      { name: 'Solang Valley', type: 'Valley', estimatedCost: 250, rating: 4.6, timings: '9 AM - 5 PM' },
      { name: 'Rohtang Pass', type: 'Mountain Pass', estimatedCost: 550, rating: 4.5, timings: 'Summer only' },
      { name: 'Hadimba Devi Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '8 AM - 6 PM' },
      { name: 'Manu Temple', type: 'Temple', estimatedCost: 0, rating: 4.3, timings: '7 AM - 8 PM' },
      { name: 'Old Manali', type: 'Village', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    rishikesh: [
      { name: 'Ram Jhula & Laxman Jhula', type: 'Bridge', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Triveni Ghat Aarti', type: 'Religious', estimatedCost: 0, rating: 4.6, timings: 'Daily evening' },
      { name: 'Rafting on Ganges', type: 'Adventure', estimatedCost: 600, rating: 4.7, timings: '8 AM - 5 PM' },
      { name: 'Neelkanth Mahadev Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '6 AM - 7 PM' },
      { name: 'Beatles Ashram', type: 'Heritage', estimatedCost: 150, rating: 4.3, timings: '8 AM - 5 PM' },
    ],
    haridwar: [
      { name: 'Har Ki Pauri Ghat', type: 'Religious', estimatedCost: 0, rating: 4.7, timings: 'All day' },
      { name: 'Mansa Devi Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '5 AM - 9 PM' },
      { name: 'Chandi Devi Temple', type: 'Temple', estimatedCost: 75, rating: 4.4, timings: '6 AM - 8 PM' },
    ],
    dehradun: [
      { name: 'Robbers Cave (Gucchupani)', type: 'Cave', estimatedCost: 25, rating: 4.3, timings: '8 AM - 6 PM' },
      { name: 'Sahastradhara', type: 'Waterfall', estimatedCost: 30, rating: 4.1, timings: '8 AM - 6 PM' },
      { name: 'Mindrolling Monastery', type: 'Monastery', estimatedCost: 0, rating: 4.4, timings: '9 AM - 7 PM' },
      { name: 'Tapkeshwar Temple', type: 'Temple', estimatedCost: 0, rating: 4.3, timings: '6 AM - 7 PM' },
    ],
    mussoorie: [
      { name: 'Kempty Falls', type: 'Waterfall', estimatedCost: 50, rating: 4.2, timings: '8 AM - 6 PM' },
      { name: 'Mall Road', type: 'Market', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Gun Hill Cable Car', type: 'Viewpoint', estimatedCost: 75, rating: 4.3, timings: '8 AM - 8 PM' },
      { name: 'Lal Tibba', type: 'Viewpoint', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    // ── Punjab & Haryana ──────────────────────────────────────────────────────
    amritsar: [
      { name: 'Golden Temple (Harmandir Sahib)', type: 'Religious', estimatedCost: 0, rating: 4.9, timings: 'Open 24 hrs' },
      { name: 'Wagah Border Ceremony', type: 'Experience', estimatedCost: 0, rating: 4.7, timings: 'Evening' },
      { name: 'Jallianwala Bagh', type: 'Heritage', estimatedCost: 0, rating: 4.5, timings: '6:30 AM - 7:30 PM' },
      { name: 'Durgiana Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '4:30 AM - 11 PM' },
      { name: 'Partition Museum', type: 'Museum', estimatedCost: 200, rating: 4.6, timings: '10 AM - 6 PM' },
    ],
    chandigarh: [
      { name: 'Rock Garden', type: 'Garden', estimatedCost: 30, rating: 4.5, timings: '9 AM - 7 PM' },
      { name: 'Sukhna Lake', type: 'Lake', estimatedCost: 0, rating: 4.4, timings: '5 AM - 9 PM' },
      { name: 'Rose Garden (Zakir Hussain)', type: 'Garden', estimatedCost: 20, rating: 4.3, timings: '6 AM - 10 PM' },
      { name: 'Capitol Complex', type: 'Monument', estimatedCost: 0, rating: 4.2, timings: 'All day' },
    ],
    // ── Goa ──────────────────────────────────────────────────────────────────
    goa: [
      { name: 'Calangute Beach', type: 'Beach', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Basilica of Bom Jesus', type: 'Church', estimatedCost: 0, rating: 4.6, timings: '9 AM - 6:30 PM' },
      { name: 'Fort Aguada', type: 'Fort', estimatedCost: 0, rating: 4.4, timings: '9:30 AM - 6 PM' },
      { name: 'Dudhsagar Falls', type: 'Waterfall', estimatedCost: 400, rating: 4.6, timings: '6 AM - 6 PM' },
      { name: 'Anjuna Flea Market', type: 'Market', estimatedCost: 0, rating: 4.3, timings: 'Wed 8 AM - Sunset' },
    ],
    panaji: [
      { name: 'Basilica of Bom Jesus', type: 'Church', estimatedCost: 0, rating: 4.6, timings: '9 AM - 6:30 PM' },
      { name: 'Fontainhas Latin Quarter', type: 'Heritage', estimatedCost: 0, rating: 4.4, timings: 'All day' },
      { name: 'Miramar Beach', type: 'Beach', estimatedCost: 0, rating: 4.2, timings: 'All day' },
    ],
    // ── Maharashtra ───────────────────────────────────────────────────────────
    pune: [
      { name: 'Shaniwar Wada', type: 'Fort', estimatedCost: 5, rating: 4.4, timings: '8 AM - 6:30 PM' },
      { name: 'Aga Khan Palace', type: 'Heritage', estimatedCost: 5, rating: 4.4, timings: '9 AM - 5:30 PM' },
      { name: 'Sinhagad Fort', type: 'Fort', estimatedCost: 50, rating: 4.5, timings: '5 AM - 6 PM' },
      { name: 'Osho Ashram', type: 'Meditation', estimatedCost: 200, rating: 4.3, timings: '9 AM - 5 PM' },
      { name: 'Pataleshwar Cave Temple', type: 'Temple', estimatedCost: 0, rating: 4.2, timings: '8:30 AM - 5:30 PM' },
    ],
    aurangabad: [
      { name: 'Ajanta Caves', type: 'Heritage', estimatedCost: 40, rating: 4.7, timings: '9 AM - 5 PM (Tue closed)' },
      { name: 'Ellora Caves', type: 'Heritage', estimatedCost: 40, rating: 4.7, timings: '6 AM - 6 PM (Tue closed)' },
      { name: 'Bibi Ka Maqbara', type: 'Monument', estimatedCost: 25, rating: 4.3, timings: '8 AM - 8 PM' },
    ],
    nashik: [
      { name: 'Trimbakeshwar Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '5:30 AM - 9 PM' },
      { name: 'Pandavleni Caves', type: 'Heritage', estimatedCost: 25, rating: 4.3, timings: '8 AM - 6 PM' },
      { name: 'Sula Vineyards', type: 'Vineyard', estimatedCost: 200, rating: 4.5, timings: '11 AM - 11 PM' },
    ],
    // ── Gujarat ───────────────────────────────────────────────────────────────
    ahmedabad: [
      { name: 'Sabarmati Ashram', type: 'Heritage', estimatedCost: 0, rating: 4.6, timings: '8:30 AM - 6:30 PM' },
      { name: 'Adalaj Stepwell', type: 'Heritage', estimatedCost: 0, rating: 4.5, timings: '6 AM - 6 PM' },
      { name: 'Kankaria Lake', type: 'Lake', estimatedCost: 25, rating: 4.3, timings: '9 AM - 10 PM' },
      { name: 'Akshardham Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '9:30 AM - 7:30 PM' },
    ],
    surat: [
      { name: 'Dumas Beach', type: 'Beach', estimatedCost: 0, rating: 4.1, timings: 'All day' },
      { name: 'Surat Castle', type: 'Fort', estimatedCost: 0, rating: 4.0, timings: '8 AM - 6 PM' },
      { name: 'Sardar Patel Museum', type: 'Museum', estimatedCost: 10, rating: 4.1, timings: '10 AM - 5 PM' },
    ],
    // ── South India ───────────────────────────────────────────────────────────
    kochi: [
      { name: 'Fort Kochi & Chinese Fishing Nets', type: 'Heritage', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Mattancherry Palace', type: 'Palace', estimatedCost: 5, rating: 4.3, timings: '10 AM - 5 PM (Fri closed)' },
      { name: 'Jewish Synagogue', type: 'Religious', estimatedCost: 0, rating: 4.4, timings: '10 AM - 1 PM, 3 PM - 5 PM' },
      { name: 'Backwater Houseboat', type: 'Boat Ride', estimatedCost: 700, rating: 4.7, timings: '8 AM - 6 PM' },
      { name: 'Kerala Folklore Museum', type: 'Museum', estimatedCost: 100, rating: 4.4, timings: '9:30 AM - 6 PM' },
    ],
    cochin: [
      { name: 'Fort Kochi & Chinese Fishing Nets', type: 'Heritage', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Mattancherry Palace', type: 'Palace', estimatedCost: 5, rating: 4.3, timings: '10 AM - 5 PM (Fri closed)' },
      { name: 'Backwater Houseboat', type: 'Boat Ride', estimatedCost: 700, rating: 4.7, timings: '8 AM - 6 PM' },
      { name: 'Kerala Folklore Museum', type: 'Museum', estimatedCost: 100, rating: 4.4, timings: '9:30 AM - 6 PM' },
    ],
    mysore: [
      { name: 'Mysore Palace', type: 'Palace', estimatedCost: 70, rating: 4.7, timings: '10 AM - 5:30 PM' },
      { name: 'Chamundeshwari Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '6 AM - 2 PM, 3:30 PM - 9 PM' },
      { name: 'Brindavan Gardens', type: 'Garden', estimatedCost: 15, rating: 4.4, timings: '6 PM - 8:30 PM (Musical Fountain)' },
      { name: 'St. Philomena\'s Church', type: 'Church', estimatedCost: 0, rating: 4.5, timings: '5 AM - 9 PM' },
    ],
    mysuru: [
      { name: 'Mysore Palace', type: 'Palace', estimatedCost: 70, rating: 4.7, timings: '10 AM - 5:30 PM' },
      { name: 'Chamundeshwari Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '6 AM - 2 PM, 3:30 PM - 9 PM' },
      { name: 'Brindavan Gardens', type: 'Garden', estimatedCost: 15, rating: 4.4, timings: '6 PM - 8:30 PM' },
      { name: "St. Philomena's Church", type: 'Church', estimatedCost: 0, rating: 4.5, timings: '5 AM - 9 PM' },
    ],
    ooty: [
      { name: 'Nilgiri Mountain Railway', type: 'Experience', estimatedCost: 30, rating: 4.6, timings: 'Morning departures' },
      { name: 'Ooty Lake', type: 'Lake', estimatedCost: 30, rating: 4.2, timings: '9 AM - 6 PM' },
      { name: 'Botanical Garden', type: 'Garden', estimatedCost: 30, rating: 4.4, timings: '7 AM - 6:30 PM' },
      { name: 'Doddabetta Peak', type: 'Viewpoint', estimatedCost: 10, rating: 4.3, timings: '7 AM - 6 PM' },
    ],
    munnar: [
      { name: 'Tea Gardens & Factory Tour', type: 'Experience', estimatedCost: 100, rating: 4.5, timings: '9 AM - 5 PM' },
      { name: 'Eravikulam National Park', type: 'Nature', estimatedCost: 110, rating: 4.6, timings: '7:30 AM - 4 PM' },
      { name: 'Mattupetty Dam', type: 'Dam', estimatedCost: 0, rating: 4.2, timings: '9:30 AM - 5 PM' },
      { name: 'Top Station', type: 'Viewpoint', estimatedCost: 0, rating: 4.4, timings: '7 AM - 6 PM' },
    ],
    'thiruvananthapuram': [
      { name: 'Padmanabhaswamy Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '3:30 AM - 7:15 PM' },
      { name: 'Napier Museum', type: 'Museum', estimatedCost: 20, rating: 4.3, timings: '10 AM - 5 PM (Mon closed)' },
      { name: 'Kovalam Beach', type: 'Beach', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    trivandrum: [
      { name: 'Padmanabhaswamy Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '3:30 AM - 7:15 PM' },
      { name: 'Napier Museum', type: 'Museum', estimatedCost: 20, rating: 4.3, timings: '10 AM - 5 PM (Mon closed)' },
      { name: 'Kovalam Beach', type: 'Beach', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    // ── North-East ────────────────────────────────────────────────────────────
    darjeeling: [
      { name: 'Tiger Hill Sunrise', type: 'Viewpoint', estimatedCost: 70, rating: 4.7, timings: '4 AM - 6 AM' },
      { name: 'Darjeeling Himalayan Railway', type: 'Experience', estimatedCost: 40, rating: 4.6, timings: 'Morning departures' },
      { name: 'Batasia Loop', type: 'Viewpoint', estimatedCost: 10, rating: 4.4, timings: '8 AM - 6 PM' },
      { name: 'Peace Pagoda', type: 'Monument', estimatedCost: 0, rating: 4.5, timings: '4:30 AM - 8 PM' },
      { name: 'Tea Garden Estates', type: 'Experience', estimatedCost: 50, rating: 4.4, timings: '8 AM - 5 PM' },
    ],
    gangtok: [
      { name: 'Rumtek Monastery', type: 'Monastery', estimatedCost: 0, rating: 4.5, timings: '9 AM - 4 PM' },
      { name: 'Tsomgo (Changu) Lake', type: 'Lake', estimatedCost: 200, rating: 4.6, timings: '9 AM - 4 PM' },
      { name: 'Nathula Pass', type: 'Mountain Pass', estimatedCost: 200, rating: 4.6, timings: 'Permit required' },
      { name: 'MG Marg', type: 'Market', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    guwahati: [
      { name: 'Kamakhya Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '5:30 AM - 10 PM' },
      { name: 'Umananda Island', type: 'Temple', estimatedCost: 30, rating: 4.3, timings: '8 AM - 5:30 PM' },
      { name: 'Brahmaputra River Cruise', type: 'Boat Ride', estimatedCost: 200, rating: 4.4, timings: '8 AM - 5 PM' },
    ],
    // ── Jammu & Kashmir / Ladakh ──────────────────────────────────────────────
    srinagar: [
      { name: 'Dal Lake Shikara Ride', type: 'Lake', estimatedCost: 500, rating: 4.8, timings: 'All day' },
      { name: 'Mughal Gardens (Shalimar, Nishat)', type: 'Garden', estimatedCost: 24, rating: 4.5, timings: '7 AM - 7 PM' },
      { name: 'Shankaracharya Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '7 AM - 4 PM' },
      { name: 'Gulmarg Gondola', type: 'Adventure', estimatedCost: 840, rating: 4.7, timings: '10 AM - 4 PM' },
    ],
    leh: [
      { name: 'Pangong Tso Lake', type: 'Lake', estimatedCost: 400, rating: 4.8, timings: 'Permit req. summer only' },
      { name: 'Leh Palace', type: 'Palace', estimatedCost: 25, rating: 4.5, timings: '8 AM - 1 PM' },
      { name: 'Thiksey Monastery', type: 'Monastery', estimatedCost: 30, rating: 4.6, timings: '7 AM - 6 PM' },
      { name: 'Nubra Valley', type: 'Valley', estimatedCost: 400, rating: 4.7, timings: 'Permit req. summer only' },
      { name: 'Magnetic Hill', type: 'Natural Wonder', estimatedCost: 0, rating: 4.2, timings: 'All day' },
    ],
    // ── Madhya Pradesh ────────────────────────────────────────────────────────
    bhopal: [
      { name: 'Upper Lake (Bhojtal)', type: 'Lake', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Sanchi Stupa', type: 'Heritage', estimatedCost: 40, rating: 4.6, timings: '8:30 AM - 5:30 PM' },
      { name: 'Bhimbetka Rock Shelters', type: 'Heritage', estimatedCost: 25, rating: 4.5, timings: '7 AM - 6 PM' },
      { name: 'Van Vihar National Park', type: 'Nature', estimatedCost: 30, rating: 4.3, timings: '7 AM - 6:30 PM' },
    ],
    indore: [
      { name: 'Rajwada Palace', type: 'Palace', estimatedCost: 10, rating: 4.3, timings: '10 AM - 5 PM' },
      { name: 'Lal Bagh Palace', type: 'Palace', estimatedCost: 10, rating: 4.4, timings: '10 AM - 5 PM (Mon closed)' },
      { name: 'Sarafa Bazaar', type: 'Market', estimatedCost: 0, rating: 4.4, timings: '9 PM - 2 AM' },
      { name: 'Patalpani Waterfall', type: 'Waterfall', estimatedCost: 0, rating: 4.3, timings: 'All day' },
    ],
    khajuraho: [
      { name: 'Western Group of Temples', type: 'Heritage', estimatedCost: 40, rating: 4.7, timings: 'Sunrise - Sunset' },
      { name: 'Eastern Group of Temples', type: 'Heritage', estimatedCost: 0, rating: 4.5, timings: 'All day' },
      { name: 'Panna National Park', type: 'Nature', estimatedCost: 150, rating: 4.4, timings: '6 AM - 6 PM' },
    ],
    // ── Bihar & Jharkhand ─────────────────────────────────────────────────────
    patna: [
      { name: 'Mahavir Mandir', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '5 AM - 9:30 PM' },
      { name: 'Golghar', type: 'Monument', estimatedCost: 5, rating: 4.2, timings: '9 AM - 5 PM' },
      { name: 'Bihar Museum', type: 'Museum', estimatedCost: 100, rating: 4.4, timings: '10 AM - 5 PM (Mon closed)' },
    ],
    bodh_gaya: [
      { name: 'Mahabodhi Temple', type: 'Religious', estimatedCost: 0, rating: 4.8, timings: '5 AM - 9 PM' },
      { name: 'Bodhi Tree', type: 'Religious', estimatedCost: 0, rating: 4.7, timings: '5 AM - 9 PM' },
      { name: 'Great Buddha Statue', type: 'Monument', estimatedCost: 0, rating: 4.5, timings: '7 AM - 6 PM' },
    ],
    'bodh gaya': [
      { name: 'Mahabodhi Temple', type: 'Religious', estimatedCost: 0, rating: 4.8, timings: '5 AM - 9 PM' },
      { name: 'Bodhi Tree', type: 'Religious', estimatedCost: 0, rating: 4.7, timings: '5 AM - 9 PM' },
      { name: 'Great Buddha Statue', type: 'Monument', estimatedCost: 0, rating: 4.5, timings: '7 AM - 6 PM' },
    ],
    // ── Odisha ────────────────────────────────────────────────────────────────
    bhubaneswar: [
      { name: 'Lingaraja Temple', type: 'Temple', estimatedCost: 0, rating: 4.6, timings: '6 AM - 9 PM' },
      { name: 'Mukteshwar Temple', type: 'Temple', estimatedCost: 0, rating: 4.5, timings: '6 AM - 9 PM' },
      { name: 'Udayagiri & Khandagiri Caves', type: 'Heritage', estimatedCost: 25, rating: 4.3, timings: '7 AM - 6 PM' },
    ],
    puri: [
      { name: 'Jagannath Temple', type: 'Temple', estimatedCost: 0, rating: 4.7, timings: '5 AM - 10 PM (Hindus only)' },
      { name: 'Puri Beach', type: 'Beach', estimatedCost: 0, rating: 4.4, timings: 'All day' },
      { name: 'Konark Sun Temple', type: 'Heritage', estimatedCost: 40, rating: 4.7, timings: '6 AM - 8 PM' },
    ],
    // ── Andhra Pradesh ────────────────────────────────────────────────────────
    visakhapatnam: [
      { name: 'RK Beach', type: 'Beach', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Submarine Museum (INS Kursura)', type: 'Museum', estimatedCost: 40, rating: 4.4, timings: '9 AM - 5:30 PM' },
      { name: 'Araku Valley', type: 'Valley', estimatedCost: 200, rating: 4.5, timings: 'Day trip' },
      { name: 'Borra Caves', type: 'Cave', estimatedCost: 65, rating: 4.4, timings: '10 AM - 5 PM' },
    ],
    vizag: [
      { name: 'RK Beach', type: 'Beach', estimatedCost: 0, rating: 4.3, timings: 'All day' },
      { name: 'Submarine Museum (INS Kursura)', type: 'Museum', estimatedCost: 40, rating: 4.4, timings: '9 AM - 5:30 PM' },
      { name: 'Araku Valley', type: 'Valley', estimatedCost: 200, rating: 4.5, timings: 'Day trip' },
    ],
    // ── Pondicherry ───────────────────────────────────────────────────────────
    pondicherry: [
      { name: 'Auroville', type: 'Meditation', estimatedCost: 0, rating: 4.5, timings: '9 AM - 5:30 PM' },
      { name: 'Promenade Beach', type: 'Beach', estimatedCost: 0, rating: 4.4, timings: 'All day' },
      { name: 'Sri Aurobindo Ashram', type: 'Religious', estimatedCost: 0, rating: 4.5, timings: '8 AM - 12 PM, 2 PM - 6 PM' },
      { name: 'French Quarter', type: 'Heritage', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
    puducherry: [
      { name: 'Auroville', type: 'Meditation', estimatedCost: 0, rating: 4.5, timings: '9 AM - 5:30 PM' },
      { name: 'Promenade Beach', type: 'Beach', estimatedCost: 0, rating: 4.4, timings: 'All day' },
      { name: 'Sri Aurobindo Ashram', type: 'Religious', estimatedCost: 0, rating: 4.5, timings: '8 AM - 12 PM, 2 PM - 6 PM' },
      { name: 'French Quarter', type: 'Heritage', estimatedCost: 0, rating: 4.4, timings: 'All day' },
    ],
  };

  const key = city.toLowerCase();
  const all = cityAttractions[key] || [];

  // Budget filter: if activitiesBudget > 0, show free attractions + those
  // affordable within budget. Sort: free first, then by cost ascending.
  if (activitiesBudget > 0 && all.length > 0) {
    const affordable = all.filter((a) => a.estimatedCost <= activitiesBudget);
    // Always keep free ones; if nothing is affordable, fall back to full list
    const filtered = affordable.length > 0 ? affordable : all;
    return filtered.sort((a, b) => a.estimatedCost - b.estimatedCost);
  }

  return all;
};

/**
 * Ultra-budget transport options appended to every search.
 * Ensures any budget (even ₹1) always has a viable transport option available.
 * Distance-aware: Only shows appropriate modes based on route distance.
 * All fares are ESTIMATED — TODO: replace with real per-route fare lookup when available.
 */
const getUltraBudgetTransportOptions = (source, destination) => {
  // Determine distance to validate transport mode suitability
  const routeKey = `${(source || '').toLowerCase()}-${(destination || '').toLowerCase()}`;
  const isShortDistance = (source && destination && 
    (source.toLowerCase() === destination.toLowerCase() ||
     source.includes('nearby') || destination.includes('nearby')));
  
  // Major cities that have long intercity routes
  const majorCities = ['delhi', 'patna', 'mumbai', 'bangalore', 'hyderabad', 'kolkata', 'goa', 'jaipur', 'pune', 'chandigarh'];
  const isLongDistance = majorCities.some(city => 
    routeKey.includes(city) && routeKey.split('-').length === 2 && 
    routeKey.split('-')[0] !== routeKey.split('-')[1]
  );
  
  const allOptions = [];
  
  // ========== LONG DISTANCE ROUTES (e.g., Delhi-Mumbai, Delhi-Bangalore) ==========
  // For long distances, ONLY show intercity transport (train, bus, flight)
  // NO shared-auto, NO cycle rickshaw, NO walking (these are inappropriate)
  if (isLongDistance) {
    allOptions.push(
      {
        mode: 'train',
        provider: 'Indian Railways — Unreserved (General Class)',
        class: 'general',
        totalCost: 75,
        duration: 'Varies by route',
        note: 'No reservation needed. Cheapest rail option at approx ₹0.8–1.5/km. Ideal for long distances.',
        apiSource: 'estimated',
        budgetType: 'ultra',
      },
      {
        mode: 'bus',
        provider: 'State Roadways Bus (General / Ordinary)',
        class: 'general',
        totalCost: 120,
        duration: 'Varies by route',
        note: 'Government bus — cheapest intercity option. No AC. Available on most routes.',
        apiSource: 'estimated',
        budgetType: 'ultra',
      },
      {
        mode: 'flight-budget',
        provider: 'Budget Airlines',
        class: 'economy',
        totalCost: 2500,
        duration: 'Check availability',
        note: 'Economy flights from IndiGo, SpiceJet, GoAir. Check for flash sales and offers. Often cheaper than trains/buses!',
        apiSource: 'estimated',
        budgetType: 'ultra-stretch',
      }
    );
  }
  // ========== SHORT DISTANCE ROUTES (local/within-city) ==========
  else {
    // For short/local distances, include local transport modes
    allOptions.push(
      {
        mode: 'shared-auto',
        provider: 'Local Shared Auto Rickshaw',
        class: 'shared',
        totalCost: 40,
        duration: 'Short distances (under 20 km)',
        note: 'Fixed route, shared with other passengers. Ask locals for the right route.',
        apiSource: 'estimated',
        budgetType: 'ultra',
      },
      {
        mode: 'rickshaw',
        provider: 'Cycle Rickshaw',
        class: 'manual',
        totalCost: 25,
        duration: 'Very short distances (under 5 km)',
        note: 'Ideal for last-mile travel. Always negotiate fare before boarding.',
        apiSource: 'estimated',
        budgetType: 'ultra',
      },
      {
        mode: 'bus',
        provider: 'City Bus',
        class: 'general',
        totalCost: 20,
        duration: 'Local routes',
        note: 'Cheapest public transport for city travel.',
        apiSource: 'estimated',
        budgetType: 'ultra',
      }
    );
    
    // Only add walk for very short/same-location distances
    if (isShortDistance) {
      allOptions.push({
        mode: 'walk',
        provider: 'On foot',
        class: 'general',
        totalCost: 0,
        duration: 'Distances under 3 km',
        note: 'Completely free. Use offline maps (Google Maps / Maps.me) and ask locals.',
        apiSource: 'estimated',
        budgetType: 'ultra',
      });
    }
  }
  
  return allOptions;
};

/**
 * Free food sources by city.
 * Sources: Gurudwara langars (24h, open to all), temple bhandaras, NGO/government kitchens.
 * All data is MOCK / ESTIMATED for demonstration purposes.
 * TODO: Replace with a verified real-world database of free food locations.
 */
const getFreeFoodSources = (city) => {
  const db = {
    delhi: [
      { name: 'Gurudwara Bangla Sahib', type: 'Gurudwara Langar', address: 'Connaught Place, New Delhi', timings: '24 hours', cost: 0, meals: ['All day'], note: 'One of the largest langars in Delhi. Dal, roti, rice, kheer. All welcome.' },
      { name: 'Gurudwara Rakab Ganj Sahib', type: 'Gurudwara Langar', address: 'Near Parliament House, New Delhi', timings: '24 hours', cost: 0, meals: ['All day'], note: 'Free langar throughout the day. No questions asked.' },
      { name: 'ISKCON Temple Delhi', type: 'Temple Prasad', address: 'Sant Nagar, East of Kailash', timings: '12:30 PM – 1:30 PM, 7:30 PM – 8:30 PM', cost: 0, meals: ['Lunch', 'Dinner'], note: 'Free satvik vegetarian prasad after aarti.' },
      { name: 'Robin Hood Army (roving)', type: 'NGO Food Drive', address: 'Various locations, New Delhi', timings: '7:00 PM – 10:00 PM', cost: 0, meals: ['Dinner'], note: 'Volunteer-run surplus food. Check their social media for daily spots.' },
    ],
    mumbai: [
      { name: 'Gurudwara Sahib Wadala', type: 'Gurudwara Langar', address: 'Wadala, Mumbai', timings: '6:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar for all. Dal, roti, sabzi, chawal.' },
      { name: 'Siddhivinayak Temple (Tuesdays)', type: 'Temple Prasad', address: 'Prabhadevi, Mumbai', timings: 'Tuesdays 8:00 AM – 10:00 PM', cost: 0, meals: ['Prasad'], note: 'Free modak prasad distributed on Tuesdays.' },
      { name: 'Roti Bank Mumbai', type: 'NGO Food Drive', address: 'Multiple locations across Mumbai', timings: '7:00 PM – 9:00 PM', cost: 0, meals: ['Dinner'], note: 'Redistributes surplus food daily. Search "Roti Bank Mumbai" for current spots.' },
      { name: 'Mahim Dargah (Thursdays)', type: 'Dargah Langar', address: 'Mahim, Mumbai', timings: 'Thursdays 12:00 PM – 3:00 PM', cost: 0, meals: ['Lunch'], note: 'Free biryani and meals on Thursdays.' },
    ],
    goa: [
      { name: 'Gurudwara Sahib Panaji', type: 'Gurudwara Langar', address: 'Panaji, North Goa', timings: '7:00 AM – 8:00 PM', cost: 0, meals: ['All day'], note: 'Free langar. Simple vegetarian meals. All welcome.' },
      { name: 'Sri Mangeshi Temple Bhandara', type: 'Temple Bhandara', address: 'Mangeshi, Ponda, Goa', timings: 'Fridays and major festivals', cost: 0, meals: ['Lunch'], note: 'Free community meals on Fridays and auspicious days.' },
    ],
    jaipur: [
      { name: 'Gurudwara Sahib Jaipur', type: 'Gurudwara Langar', address: 'Civil Lines, Jaipur', timings: '6:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar throughout the day.' },
      { name: 'Govind Dev Ji Temple Prasad', type: 'Temple Prasad', address: 'City Palace, Jaipur', timings: '4:30 AM – 12:00 PM, 5:30 PM – 9:30 PM', cost: 0, meals: ['Morning prasad'], note: 'Free prasad distributed during aarti.' },
      { name: 'Annapurna Rasoi (State Scheme)', type: 'Government Subsidised Kitchen', address: 'Multiple locations, Jaipur', timings: '8:00 AM – 2:00 PM', cost: 8, meals: ['Breakfast ₹5', 'Lunch ₹8'], note: 'Rajasthan government subsidised canteen. Full thali ₹8.' },
    ],
    bangalore: [
      { name: 'Gurudwara Sahib Bengaluru', type: 'Gurudwara Langar', address: 'HMT Layout, Bengaluru', timings: '7:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar. Dal, roti, rice, sabzi.' },
      { name: 'ISKCON Bangalore Temple', type: 'Temple Prasad', address: 'Rajajinagar, Bengaluru', timings: '1:00 PM – 1:30 PM', cost: 0, meals: ['Lunch prasad'], note: 'Large ISKCON temple with daily free prasad.' },
      { name: 'Indira Canteen', type: 'Government Subsidised Kitchen', address: 'Multiple wards, Bengaluru', timings: '7:30 AM – 11:00 AM, 12:00 PM – 3:00 PM', cost: 5, meals: ['Breakfast ₹5', 'Meals ₹10'], note: 'Karnataka government canteen. Idli ₹5, meals ₹10.' },
    ],
    bengaluru: [
      { name: 'Gurudwara Sahib Bengaluru', type: 'Gurudwara Langar', address: 'HMT Layout, Bengaluru', timings: '7:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar. Dal, roti, rice, sabzi.' },
      { name: 'ISKCON Bangalore Temple', type: 'Temple Prasad', address: 'Rajajinagar, Bengaluru', timings: '1:00 PM – 1:30 PM', cost: 0, meals: ['Lunch prasad'], note: 'Free prasad after noon aarti.' },
      { name: 'Indira Canteen', type: 'Government Subsidised Kitchen', address: 'Multiple wards, Bengaluru', timings: '7:30 AM – 3:00 PM', cost: 5, meals: ['Breakfast ₹5', 'Meals ₹10'], note: 'Idli ₹5, full meals ₹10.' },
    ],
    kolkata: [
      { name: 'Gurudwara Sahib Kolkata', type: 'Gurudwara Langar', address: 'Chetla, Kolkata', timings: '7:00 AM – 8:00 PM', cost: 0, meals: ['All day'], note: 'Free langar open to all visitors.' },
      { name: 'Dakshineswar Kali Temple Prasad', type: 'Temple Prasad', address: 'Dakshineswar, Kolkata', timings: '6:00 AM aarti & 6:00 PM aarti', cost: 0, meals: ['Prasad after aarti'], note: 'Free prasad distribution, especially Tuesdays and Saturdays.' },
      { name: 'Ramakrishna Mission Meal', type: 'Mission Canteen', address: 'Belur Math, Howrah', timings: '11:30 AM – 1:00 PM (selected days)', cost: 0, meals: ['Lunch'], note: 'Free meals on special occasions. Simple satvik food.' },
    ],
    hyderabad: [
      { name: 'Gurudwara Sahib Hyderabad', type: 'Gurudwara Langar', address: 'Secunderabad, Hyderabad', timings: '6:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar for all.' },
      { name: 'ISKCON Temple Hyderabad', type: 'Temple Prasad', address: 'Nampally, Hyderabad', timings: '12:30 PM – 1:00 PM', cost: 0, meals: ['Lunch'], note: 'Free prasad (sambar rice, dal, sweets) after noon aarti.' },
      { name: 'Anna Poorna Scheme (TS Govt)', type: 'Government Subsidised Kitchen', address: 'Multiple locations, Hyderabad', timings: '7:00 AM – 3:00 PM', cost: 5, meals: ['Breakfast ₹5', 'Lunch ₹10'], note: 'Telangana govt subsidised meals. Idli ₹5, rice meals ₹10.' },
    ],
    chennai: [
      { name: 'Gurudwara Sahib Chennai', type: 'Gurudwara Langar', address: 'Adyar, Chennai', timings: '7:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar open to all.' },
      { name: 'Kapaleeshwarar Temple Annadhanam', type: 'Temple Annadhanam', address: 'Mylapore, Chennai', timings: '12:00 PM – 2:00 PM (festival days)', cost: 0, meals: ['Lunch on festival days'], note: 'Free annadhanam during major festivals and auspicious Tuesdays/Saturdays.' },
      { name: 'Amma Unavagam (State Scheme)', type: 'Government Subsidised Kitchen', address: '400+ locations across Chennai', timings: '7:00 AM – 3:00 PM', cost: 5, meals: ['Idli ₹1', 'Pongal ₹3', 'Meals ₹5'], note: 'Tamil Nadu govt scheme. Idli ₹1, full meals ₹5. Outstanding value.' },
    ],
    amritsar: [
      { name: 'Harmandir Sahib (Golden Temple) Langar', type: 'Gurudwara Langar', address: 'Golden Temple Complex, Amritsar', timings: '24 hours, 365 days', cost: 0, meals: ['All day'], note: 'Largest free kitchen in the world. 100,000+ meals served daily. ALL are welcome — no religion, no caste.' },
      { name: 'Sri Durgiana Temple', type: 'Temple Bhandara', address: 'Near Golden Temple, Amritsar', timings: 'Festivals & weekends', cost: 0, meals: ['Lunch on bhandara days'], note: 'Free prasad and occasional bhandara meals distributed.' },
    ],
    varanasi: [
      { name: 'Annapurna Temple Bhandara', type: 'Temple Annadhanam', address: 'Vishwanath Gali, Varanasi', timings: '12:00 PM – 2:00 PM', cost: 0, meals: ['Lunch'], note: 'Free meals offered daily at Goddess Annapurna temple.' },
      { name: 'Gurudwara Guru Ka Bagh', type: 'Gurudwara Langar', address: 'Near Cantonment, Varanasi', timings: '7:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar. Dal, roti, sabzi.' },
    ],
    pune: [
      { name: 'Gurudwara Sahib Pune', type: 'Gurudwara Langar', address: 'Sangamvadi, Pune', timings: '7:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar for all visitors.' },
      { name: 'Dagdusheth Halwai Ganapati Temple', type: 'Temple Prasad', address: 'Budhwar Peth, Pune', timings: 'Wednesdays and Fridays 12 PM', cost: 0, meals: ['Prasad + occasional bhandara'], note: 'Famous temple with regular free meals on festival days.' },
      { name: 'ISKCON Pune', type: 'Temple Prasad', address: 'Katraj, Pune', timings: '12:30 PM – 1:00 PM', cost: 0, meals: ['Lunch prasad'], note: 'Free prasad after noon aarti.' },
    ],
    ahmedabad: [
      { name: 'Gurudwara Sahib Ahmedabad', type: 'Gurudwara Langar', address: 'Ellisbridge, Ahmedabad', timings: '7:00 AM – 9:00 PM', cost: 0, meals: ['All day'], note: 'Free langar open to all.' },
      { name: 'Akshardham Temple Annadhanam', type: 'Temple Annadhanam', address: 'Gandhinagar (near Ahmedabad)', timings: 'Festival days', cost: 0, meals: ['Festival meals'], note: 'Free meals during major BAPS events and festivals.' },
      { name: 'Annapurna Canteen (AMC)', type: 'Government Subsidised Kitchen', address: 'Multiple AMC wards, Ahmedabad', timings: '8:00 AM – 2:00 PM', cost: 10, meals: ['Breakfast ₹5', 'Lunch ₹10'], note: 'Ahmedabad Municipal Corporation subsidised canteen.' },
    ],
  };

  const key = city.toLowerCase().trim().replace(/\s+/g, '');
  // Try direct match first, then partial match
  const found = db[key] || Object.entries(db).find(([k]) => key.includes(k) || k.includes(key))?.[1];
  if (found) return found;

  // Generic fallback for any city not in DB
  return [
    {
      name: `Nearest Gurudwara — ${city}`,
      type: 'Gurudwara Langar',
      address: `Search "Gurudwara near ${city}" on Google Maps`,
      timings: 'Usually 6:00 AM – 9:00 PM (many run 24 hours)',
      cost: 0,
      meals: ['Breakfast', 'Lunch', 'Dinner'],
      note: 'Every Gurudwara in India serves free langar. No religion required — just walk in.',
    },
    {
      name: `Local Temple Bhandara — ${city}`,
      type: 'Temple Bhandara',
      address: `Search "temple near ${city}" on Google Maps`,
      timings: 'Tuesdays, Saturdays, and festival days',
      cost: 0,
      meals: ['Lunch on bhandara days'],
      note: 'Most temples distribute free food on auspicious days.',
    },
    {
      name: `Government Subsidised Canteen — ${city}`,
      type: 'Government Subsidised Kitchen',
      address: `Search "Annapurna canteen ${city}" or "Amma canteen ${city}"`,
      timings: '7:00 AM – 3:00 PM (Mon–Sat)',
      cost: 10,
      meals: ['Breakfast ₹5', 'Lunch ₹10'],
      note: 'Many state governments run subsidised meal schemes. Meals for ₹5–15.',
    },
  ];
};

/**
 * Handle ultra-low budget — NEVER rejects. Builds a real plan using free community resources.
 * Free food:  Gurudwara langars, temple bhandaras, NGO kitchens (open to everyone).
 * Free stay:  Gurudwara / temple dharamshalas.
 * Transport:  Walking, cycle rickshaw, shared auto, government bus.
 * All location data is MOCK / ESTIMATED — TODO: replace with verified DB when available.
 */
const handleLowBudgetScenario = ({
  source,
  destination,
  totalBudget,
  numberOfTravelers,
  numberOfDays,
  cheapestTransport,
}) => {
  const transportCost = cheapestTransport ? cheapestTransport.totalCost * numberOfTravelers : 0;
  const resolvedDays = (numberOfDays && numberOfDays >= 1) ? numberOfDays : 2;
  const resolvedNights = Math.max(0, resolvedDays - 1);
  const suggestedBudget = Math.round(Math.max(transportCost * 3, totalBudget * 5, 500));
  const freeFoodSources = getFreeFoodSources(destination);
  const attractions = getAttractionSuggestions(destination, 0);
  const freeAttractions = attractions.filter((a) => a.estimatedCost === 0);
  const localTransport = getLocalTransportSuggestions(Math.min(50, totalBudget));

  const freeFoodAsRestaurants = freeFoodSources.length > 0
    ? freeFoodSources.map((f) => ({
        name: f.name,
        cuisine: `${f.type} — FREE`,
        rating: 4.5,
        averageCost: f.cost || 0,
        address: f.address,
        timings: f.timings,
        isFree: f.cost === 0,
        note: f.note,
      }))
    : [
        { name: 'Nearest Gurudwara', cuisine: 'Langar — FREE', rating: 4.5, averageCost: 0, isFree: true, note: 'Any Gurudwara serves free langar all day. All are welcome — no religion required.' },
        { name: 'Local Temple', cuisine: 'Prasad / Bhandara — FREE', rating: 4.3, averageCost: 0, isFree: true, note: 'Temples often distribute free food on auspicious days (Tuesdays, Saturdays, festivals).' },
        { name: 'Railway Station NGO Stall', cuisine: 'Charity Food — ₹0–5', rating: 4.0, averageCost: 5, isFree: false, note: 'Many railway stations have NGO-run food stalls. Ask station staff.' },
      ];

  return {
    isOptimized: true,
    ultraBudgetMode: true,
    optimizationScore: 45,
    transport: cheapestTransport
      ? {
          mode: cheapestTransport.mode,
          provider: cheapestTransport.provider || 'Local transport',
          class: cheapestTransport.class || 'general',
          totalCost: cheapestTransport.totalCost,
          duration: cheapestTransport.duration || 'Varies',
          note: cheapestTransport.note || '',
          apiSource: cheapestTransport.apiSource || 'estimated',
        }
      : {
          mode: 'walk',
          provider: 'On foot',
          class: 'general',
          totalCost: 0,
          duration: 'As needed',
          note: 'Walk or ask locals for the nearest bus stop / Gurudwara.',
          apiSource: 'estimated',
        },
    accommodation: {
      name: 'Gurudwara / Temple Dharamshala',
      type: 'dharamshala',
      rating: 4.0,
      pricePerNight: 0,
      totalCost: 0,
      location: destination,
      amenities: ['Free stay', 'Langar meals nearby', 'Safe', 'Clean bathrooms'],
      estimated: true,
      note: 'Gurudwaras welcome ALL travellers regardless of religion. Many temples also have free/low-cost dharamshalas.',
    },
    budgetBreakdown: {
      transport: { allocated: transportCost, spent: transportCost },
      accommodation: {
        allocated: 0,
        perNight: 0,
        nights: resolvedNights,
        percentage: 0,
        note: 'Free — Gurudwara / temple dharamshala',
      },
      food: {
        allocated: 0,
        perDay: 0,
        percentage: 0,
        note: 'Free — langar / temple bhandara / NGO kitchen',
      },
      localTransport: {
        allocated: Math.max(0, totalBudget - transportCost),
        perDay: Math.max(0, totalBudget - transportCost),
        percentage: transportCost < totalBudget ? 100 : 0,
      },
      activities: { allocated: 0, percentage: 0, note: 'Free attractions and public spaces' },
      totalAllocated: totalBudget,
    },
    duration: { days: resolvedDays, nights: resolvedNights },
    recommendations: {
      restaurants: freeFoodAsRestaurants,
      freeFoodSources,
      localTransport,
      attractions: freeAttractions.length > 0 ? freeAttractions : attractions.slice(0, 4),
    },
    optimizationNotes: [
      {
        type: 'info',
        message: `Ultra-budget plan activated for ₹${totalBudget}. Using free community resources in ${destination}.`,
      },
      {
        type: 'tip',
        message: `Gurudwara langars serve FREE meals all day, every day. Open to everyone — no religion, no questions asked.`,
      },
      {
        type: 'tip',
        message: `Cycle rickshaws ₹10–20/km | Shared autos ₹5–8/km | City bus ₹1–3/km | Walking = ₹0.`,
      },
      {
        type: 'tip',
        message: `Many Gurudwaras and temples offer free overnight shelter (dharamshala). Just ask at the main desk.`,
      },
      {
        type: 'suggestion',
        message: `Adding ₹${suggestedBudget - totalBudget} more (total ₹${suggestedBudget}) unlocks budget accommodation and better transport.`,
      },
    ],
    alternativePlan: {
      hasAlternative: true,
      suggestedBudget,
      alternatives: [
        { option: `Increase Budget → ₹${suggestedBudget}`, description: 'Unlocks budget hostel stays, sleeper-class train, and paid meals' },
        { option: 'Gurudwara Langar', description: 'Free meals 24/7 at any Gurudwara. All are welcome.' },
        { option: 'Temple Dharamshala', description: 'Free/minimal-cost stay near major temples across India.' },
        { option: 'Unreserved Train (General class)', description: '₹0.8–1.5/km — cheapest rail option. No reservation needed.' },
        { option: 'State Roadways Bus', description: 'Government buses on most routes — 40–60% cheaper than private operators.' },
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
  getUltraBudgetTransportOptions,
  getFreeFoodSources,
  getLocalTransportSuggestions,
};
