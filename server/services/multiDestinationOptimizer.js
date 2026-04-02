/**
 * Multi-Destination Trip Optimizer
 * 
 * Optimizes travel budget across multiple destinations
 * 
 * Budget Allocation Strategy:
 * - 40% Travel (Flights/Trains between destinations)
 * - 40% Hotels (Accommodation for all nights)
 * - 20% Local Transport + Food
 * 
 * Features:
 * - Multi-city itinerary optimization
 * - Smart route planning (minimize backtracking)
 * - Real-time API data integration
 * - Cost minimization with quality balance
 * - Alternative suggestions on budget constraints
 */

const { searchFlights, searchHotels, searchTrains } = require('./externalApiService');
const { fetchDestinationImages } = require('./imageService');

/**
 * Main Multi-Destination Optimizer
 * @param {object} params - Trip parameters
 * @returns {Promise<object>} Optimized trip plan
 */
const optimizeMultiDestinationTrip = async ({
  startCity,
  destinations = [], // Array of destination cities
  totalBudget,
  travelDates,
  numberOfTravelers = 1,
}) => {
  console.log('\n🎯 ========== MULTI-DESTINATION TRIP OPTIMIZER ==========');
  console.log(`📍 Starting from: ${startCity}`);
  console.log(`🌍 Destinations: ${destinations.join(', ')}`);
  console.log(`💰 Total Budget: ₹${totalBudget}`);
  console.log(`👥 Travelers: ${numberOfTravelers}`);
  console.log(`📅 Travel Dates: ${travelDates.startDate} to ${travelDates.endDate}`);
  console.log('='.repeat(60));

  try {
    // ========== STEP 1: BUDGET ALLOCATION ==========
    const budgetAllocation = {
      travel: totalBudget * 0.40, // 40% for flights/trains
      hotels: totalBudget * 0.40, // 40% for accommodation
      localTransportFood: totalBudget * 0.20, // 20% for local expenses
    };

    console.log('\n💵 Budget Allocation:');
    console.log(`   Travel: ₹${budgetAllocation.travel.toFixed(2)} (40%)`);
    console.log(`   Hotels: ₹${budgetAllocation.hotels.toFixed(2)} (40%)`);
    console.log(`   Local + Food: ₹${budgetAllocation.localTransportFood.toFixed(2)} (20%)`);

    // ========== STEP 2: CALCULATE TRIP DURATION ==========
    const tripDuration = calculateDays(travelDates.startDate, travelDates.endDate);
    const nightsPerDestination = Math.floor(tripDuration / destinations.length);

    console.log(`\n📆 Trip Duration: ${tripDuration} days`);
    console.log(`🏨 Nights per destination: ${nightsPerDestination}`);

    // ========== STEP 3: PLAN OPTIMAL ROUTE ==========
    const route = planOptimalRoute(startCity, destinations);

    console.log(`\n🗺️  Optimal Route: ${route.join(' → ')}`);

    // ========== STEP 4: FETCH TRAVEL OPTIONS ==========
    console.log('\n🔍 Fetching travel options...');

    const travelLegs = [];
    let currentCity = startCity;

    for (const nextCity of destinations) {
      // Check if domestic (for train option)
      const isDomestic = true; // Assuming all India

      // Fetch both flight and train options
      const [flights, trains] = await Promise.all([
        searchFlights({
          origin: currentCity,
          destination: nextCity,
          departureDate: travelDates.startDate,
          adults: numberOfTravelers,
        }),
        isDomestic
          ? searchTrains({
              source: currentCity,
              destination: nextCity,
              date: travelDates.startDate,
            })
          : Promise.resolve([]),
      ]);

      travelLegs.push({
        from: currentCity,
        to: nextCity,
        flights: flights || [],
        trains: trains || [],
      });

      currentCity = nextCity;
    }

    // ========== STEP 5: SELECT TRAVEL OPTIONS WITH BUDGET-BASED PREFERENCE ==========
    console.log('\n✈️  Selecting travel options (budget-aware)...');

    const selectedTravel = [];
    let totalTravelCost = 0;

    for (const leg of travelLegs) {
      // ==================== FIX #3: BUDGET-BASED PREFERENCE LOGIC ====================
      // Calculate remaining budget available
      const remainingBudget = totalBudget - totalTravelCost;
      const budgetPerLeg = remainingBudget / (travelLegs.length - travelLegs.indexOf(leg));
      
      // Budget tier determination
      const budgetTier = remainingBudget > 15000 ? 'premium' : remainingBudget > 8000 ? 'comfort' : 'budget';
      
      // Tag options with type for selection
      const taggedFlights = leg.flights.map(f => ({
        ...f,
        type: 'flight',
        costForGroup: (f.totalCost || f.price) * numberOfTravelers,
      }));
      
      const taggedTrains = leg.trains.map(t => ({
        ...t,
        type: 'train',
        costForGroup: (t.totalCost || t.price) * numberOfTravelers,
      }));

      // Preference logic based on budget tier
      let selectedOption;
      
      if (budgetTier === 'premium') {
        // Premium: Prefer flights for speed/comfort
        console.log(`  💎 Premium budget (₹${remainingBudget}): Preferring flights...`);
        const affordableFlights = taggedFlights.filter(f => f.costForGroup <= budgetPerLeg);
        
        if (affordableFlights.length > 0) {
          // Pick fastest flight
          selectedOption = affordableFlights.sort((a, b) => 
            (parseInt(a.duration) || 10) - (parseInt(b.duration) || 10)
          )[0];
          console.log(`  ✈️  Selected flight: ₹${selectedOption.costForGroup}`);
        } else if (taggedTrains.length > 0) {
          // Fallback to trains if flights too expensive
          selectedOption = taggedTrains.sort((a, b) => a.costForGroup - b.costForGroup)[0];
          console.log(`  🚆 Fallback train: ₹${selectedOption.costForGroup}`);
        }
      } else if (budgetTier === 'comfort') {
        // Comfort: Mix of flights and trains, prefer based on time/cost
        console.log(`  💼 Comfort budget (₹${remainingBudget}): Balanced selection...`);
        const affordableFlights = taggedFlights.filter(f => f.costForGroup <= budgetPerLeg * 1.1);
        const affordableTrains = taggedTrains.filter(t => t.costForGroup <= budgetPerLeg);
        
        const validOptions = [...affordableFlights, ...affordableTrains];
        if (validOptions.length > 0) {
          // Sort by cost-efficiency (cost per hour)
          selectedOption = validOptions.sort((a, b) => {
            const costPerHourA = (a.costForGroup) / (parseInt(a.duration) || 8);
            const costPerHourB = (b.costForGroup) / (parseInt(b.duration) || 8);
            return costPerHourA - costPerHourB;
          })[0];
          console.log(`  ${selectedOption.type === 'flight' ? '✈️' : '🚆'} Selected: ₹${selectedOption.costForGroup}`);
        }
      } else {
        // Budget: Prefer trains (cheapest option)
        console.log(`  💰 Budget tier (₹${remainingBudget}): Prioritizing cost...`);
        const allOptions = [...taggedFlights, ...taggedTrains];
        selectedOption = allOptions.sort((a, b) => a.costForGroup - b.costForGroup)[0];
        console.log(`  ${selectedOption.type === 'flight' ? '✈️' : '🚆'} Selected: ₹${selectedOption.costForGroup}`);
      }

      if (!selectedOption) {
        console.log(`⚠️ No travel options found for ${leg.from} → ${leg.to}`);
        continue;
      }

      const costForAllTravelers = selectedOption.costForGroup;

      selectedTravel.push({
        from: leg.from,
        to: leg.to,
        mode: cheapest.mode,
        provider: cheapest.provider || cheapest.airline || 'Unknown',
        details: cheapest,
        costPerPerson: cheapest.totalCost || cheapest.price,
        totalCost: costForAllTravelers,
      });

      totalTravelCost += costForAllTravelers;

      console.log(`   ${leg.from} → ${leg.to}: ${cheapest.mode} - ₹${costForAllTravelers}`);
    }

    // Check if travel cost exceeds allocation
    if (totalTravelCost > budgetAllocation.travel) {
      console.log(`\n⚠️ WARNING: Travel cost (₹${totalTravelCost}) exceeds allocation (₹${budgetAllocation.travel})`);

      return handleBudgetExceeded({
        startCity,
        destinations,
        totalBudget,
        travelDates,
        numberOfTravelers,
        exceedBy: totalTravelCost - budgetAllocation.travel,
      });
    }

    console.log(`✅ Total Travel Cost: ₹${totalTravelCost} (within budget)`);

    // ========== STEP 6: FETCH HOTEL OPTIONS ==========
    console.log('\n🏨 Fetching hotel options...');

    const hotelsByDestination = {};
    let totalHotelCost = 0;

    for (const destination of destinations) {
      const hotels = await searchHotels({
        cityCode: destination,
        checkInDate: travelDates.startDate,
        checkOutDate: travelDates.endDate,
        adults: numberOfTravelers,
        rooms: Math.ceil(numberOfTravelers / 2), // 2 people per room
        maxPrice: budgetAllocation.hotels / destinations.length,
      });

      if (hotels && hotels.length > 0) {
        // Sort by price per night
        hotels.sort((a, b) => a.pricePerNight - b.pricePerNight);

        // Find hotel within budget
        const hotelBudget = budgetAllocation.hotels / destinations.length;
        const nightCost = hotelBudget / nightsPerDestination;

        let selectedHotel = null;

        for (const hotel of hotels) {
          if (hotel.pricePerNight <= nightCost) {
            selectedHotel = {
              ...hotel,
              nights: nightsPerDestination,
              totalCost: hotel.pricePerNight * nightsPerDestination,
            };
            break;
          }
        }

        // If no hotel found within budget, select cheapest
        if (!selectedHotel) {
          selectedHotel = {
            ...hotels[0],
            nights: nightsPerDestination,
            totalCost: hotels[0].pricePerNight * nightsPerDestination,
          };
        }

        hotelsByDestination[destination] = selectedHotel;
        totalHotelCost += selectedHotel.totalCost;

        console.log(`   ${destination}: ${selectedHotel.name} - ₹${selectedHotel.totalCost}`);
      }
    }

    console.log(`✅ Total Hotel Cost: ₹${totalHotelCost}`);

    // Check if hotel cost exceeds allocation
    if (totalHotelCost > budgetAllocation.hotels) {
      console.log(`\n⚠️ Hotel cost exceeds allocation by ₹${(totalHotelCost - budgetAllocation.hotels).toFixed(2)}`);
    }

    // ========== STEP 7: FETCH DESTINATION IMAGES ==========
    console.log('\n🖼️  Fetching destination images...');

    const destinationImages = {};

    const imagePromises = destinations.map(async (dest) => {
      const images = await fetchDestinationImages(dest);
      destinationImages[dest] = images;
      return images;
    });

    await Promise.all(imagePromises);

    console.log(`✅ Fetched images for ${Object.keys(destinationImages).length} destinations`);

    // ========== STEP 8: CALCULATE TOTALS ==========
    const grandTotal = totalTravelCost + totalHotelCost;
    const remaining = totalBudget - grandTotal;
    const localTransportBudget = budgetAllocation.localTransportFood;

    console.log('\n💰 ========== COST SUMMARY ==========');
    console.log(`   Travel: ₹${totalTravelCost.toFixed(2)}`);
    console.log(`   Hotels: ₹${totalHotelCost.toFixed(2)}`);
    console.log(`   Remaining for Local + Food: ₹${localTransportBudget.toFixed(2)}`);
    console.log(`   Total Spent: ₹${grandTotal.toFixed(2)}`);
    console.log(`   Budget: ₹${totalBudget.toFixed(2)}`);
    console.log(`   ${remaining >= 0 ? '✅ Savings' : '❌ Deficit'}: ₹${Math.abs(remaining).toFixed(2)}`);
    console.log('='.repeat(60));

    // ========== STEP 9: GENERATE OPTIMIZED PLAN ==========
    const isOptimized = grandTotal <= totalBudget;

    const optimizedPlan = {
      success: true,
      isOptimized,
      optimizationScore: calculateOptimizationScore(
        totalBudget,
        grandTotal,
        numberOfTravelers,
        destinations.length
      ),

      // Trip Overview
      tripOverview: {
        startCity,
        destinations,
        route,
        totalDays: tripDuration,
        nightsPerDestination,
        travelers: numberOfTravelers,
      },

      // Budget Breakdown
      budgetBreakdown: {
        totalBudget,
        allocated: {
          travel: budgetAllocation.travel,
          hotels: budgetAllocation.hotels,
          localTransportFood: budgetAllocation.localTransportFood,
        },
        spent: {
          travel: totalTravelCost,
          hotels: totalHotelCost,
          localTransportFood: 0, // To be spent during trip
        },
        remaining: remaining >= 0 ? remaining : 0,
        deficit: remaining < 0 ? Math.abs(remaining) : 0,
      },

      // Travel Plan
      travelPlan: selectedTravel,

      // Hotel Plan
      hotelPlan: hotelsByDestination,

      // Destination Images
      destinationImages,

      // Local Budget per Destination
      localBudgetPerDestination: localTransportBudget / destinations.length,

      // Suggestions
      suggestions: generateSuggestions({
        isOptimized,
        remaining,
        destinations,
        totalBudget,
        grandTotal,
      }),

      // Metadata
      generatedAt: new Date().toISOString(),
      totalCost: grandTotal,
      savings: remaining >= 0 ? remaining : 0,
    };

    return optimizedPlan;
  } catch (error) {
    console.error('❌ Optimization Error:', error.message);

    return {
      success: false,
      error: error.message,
      message: 'Failed to optimize trip. Please try again with different parameters.',
    };
  }
};

/**
 * Handle budget exceeded scenario
 */
const handleBudgetExceeded = ({
  startCity,
  destinations,
  totalBudget,
  travelDates,
  numberOfTravelers,
  exceedBy,
}) => {
  return {
    success: false,
    isOptimized: false,
    message: 'Budget too low for selected destinations',
    exceedBy,
    suggestions: [
      {
        type: 'increase_budget',
        message: `Increase budget by ₹${exceedBy.toFixed(2)} to make this trip feasible`,
      },
      {
        type: 'reduce_destinations',
        message: `Consider visiting fewer destinations (${Math.floor(destinations.length / 2)} instead of ${destinations.length})`,
      },
      {
        type: 'reduce_travelers',
        message: `Reduce number of travelers to lower costs`,
      },
      {
        type: 'shorter_duration',
        message: `Consider a shorter trip duration to reduce accommodation costs`,
      },
    ],
    alternativePlan: {
      message: 'Try these alternative destinations with lower costs',
      destinations: ['Nearby City 1', 'Nearby City 2'],
    },
  };
};

/**
 * Plan optimal route to minimize backtracking
 */
const planOptimalRoute = (startCity, destinations) => {
  // Simple route optimization (for production, use proper TSP algorithm)
  // For now, return as-is
  return [startCity, ...destinations];
};

/**
 * Calculate days between two dates
 */
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate optimization score (0-100)
 */
const calculateOptimizationScore = (budget, totalCost, travelers, destinations) => {
  const utilizationScore = (totalCost / budget) * 50; // Max 50 points
  const efficiencyScore = Math.min((destinations * 10), 25); // Max 25 points
  const travelerScore = Math.min((travelers * 5), 25); // Max 25 points

  return Math.min(Math.round(utilizationScore + efficiencyScore + travelerScore), 100);
};

/**
 * Generate helpful suggestions
 */
const generateSuggestions = ({ isOptimized, remaining, destinations, totalBudget, grandTotal }) => {
  const suggestions = [];

  if (isOptimized && remaining > totalBudget * 0.2) {
    suggestions.push({
      type: 'upgrade',
      message: 'You have extra budget! Consider upgrading to better hotels or flights.',
      amount: remaining,
    });
  }

  if (!isOptimized) {
    suggestions.push({
      type: 'budget_exceeded',
      message: `Your trip exceeds budget by ₹${Math.abs(remaining).toFixed(2)}. Consider reducing destinations or travel dates.`,
    });
  }

  if (destinations.length > 3) {
    suggestions.push({
      type: 'duration',
      message: 'Visiting many destinations? Consider spending more days for a relaxed trip.',
    });
  }

  suggestions.push({
    type: 'booking',
    message: 'Book in advance to get better prices on flights and hotels.',
  });

  return suggestions;
};

// ==================== EXPORTS ====================

module.exports = {
  optimizeMultiDestinationTrip,
};
