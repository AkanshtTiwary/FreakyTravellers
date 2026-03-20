/**
 * Enhanced Travel Plan Service with Real Train Data
 * Integrates Indian Railways data into travel optimization
 */

const trainService = require('./trainService');

/**
 * Get best trains for budget travel
 * Prioritizes cheaper routes (typically longer duration but cheaper fares)
 * 
 * @param {string} from - Source city
 * @param {string} to - Destination city
 * @param {string} date - Optional date in DD-MM-YYYY format
 * @returns {Promise<Object>} Best train options
 */
async function getBestTrainsForBudget(from, to, date = null) {
  try {
    let trainData;
    
    if (date) {
      trainData = await trainService.getTrainsOnDate(from, to, date);
    } else {
      trainData = await trainService.getTrainsBetweenStations(from, to);
    }

    if (!trainData.success || !trainData.data) {
      return {
        success: false,
        data: trainData.data || 'No trains found',
        transports: [],
      };
    }

    // Sort by travel time (cheaper trains usually take longer)
    const allTrains = trainService.sortTrainsByTime(trainData.data, 'desc');

    // Extract key information for budget-friendly options
    const budgetTrains = allTrains.slice(0, 10).map((train) => ({
      mode: 'train',
      type: train.train_base?.type || 'General',
      train_no: train.train_base?.train_no,
      train_name: train.train_base?.train_name,
      from_code: train.train_base?.from_stn_code,
      from_name: train.train_base?.from_stn_name,
      to_code: train.train_base?.to_stn_code,
      to_name: train.train_base?.to_stn_name,
      departure: train.train_base?.from_time,
      arrival: train.train_base?.to_time,
      duration: train.train_base?.travel_time,
      running_days: train.train_base?.running_days,
      // Estimated cost - for actual booking, user needs to check IRCTC website
      estimated_cost: estimateFareByClass(train.train_base?.type),
    }));

    return {
      success: true,
      data: budgetTrains,
      total_options: allTrains.length,
      date: date || 'Any date',
    };
  } catch (error) {
    console.error('Error getting budget trains:', error.message);
    return {
      success: false,
      data: `Error: ${error.message}`,
      transports: [],
    };
  }
}

/**
 * Get fastest trains for optimized travel
 * 
 * @param {string} from - Source city
 * @param {string} to - Destination city
 * @param {string} date - Optional date in DD-MM-YYYY format
 * @returns {Promise<Object>} Fastest train options
 */
async function getFastestTrainsForJourney(from, to, date = null) {
  try {
    let trainData;
    
    if (date) {
      trainData = await trainService.getTrainsOnDate(from, to, date);
    } else {
      trainData = await trainService.getTrainsBetweenStations(from, to);
    }

    if (!trainData.success || !trainData.data) {
      return {
        success: false,
        data: trainData.data || 'No trains found',
        transports: [],
      };
    }

    // Sort by fastest (shortest duration)
    const allTrains = trainService.sortTrainsByTime(trainData.data, 'asc');

    const fastestTrains = allTrains.slice(0, 5).map((train) => ({
      mode: 'train',
      type: train.train_base?.type || 'General',
      train_no: train.train_base?.train_no,
      train_name: train.train_base?.train_name,
      from_code: train.train_base?.from_stn_code,
      from_name: train.train_base?.from_stn_name,
      to_code: train.train_base?.to_stn_code,
      to_name: train.train_base?.to_stn_name,
      departure: train.train_base?.from_time,
      arrival: train.train_base?.to_time,
      duration: train.train_base?.travel_time,
      running_days: train.train_base?.running_days,
      estimated_cost: estimateFareByClass(train.train_base?.type),
    }));

    return {
      success: true,
      data: fastestTrains,
      total_options: allTrains.length,
      date: date || 'Any date',
    };
  } catch (error) {
    console.error('Error getting fastest trains:', error.message);
    return {
      success: false,
      data: `Error: ${error.message}`,
      transports: [],
    };
  }
}

/**
 * Estimate fare by train class
 * Note: These are approximate estimates. Actual fares vary based on distance, season, etc.
 * 
 * @param {string} trainType - Train type/class
 * @returns {number} Estimated fare
 */
function estimateFareByClass(trainType) {
  const typeStr = (trainType || '').toUpperCase();

  // Estimate per 500 km
  const baseDistance = 500;
  const fares = {
    'AC FIRST': 3000,
    'FIRST AC': 3000,
    '1A': 3000,
    'AC 2 TIER': 1500,
    'SECOND AC': 1500,
    '2A': 1500,
    'AC 3 TIER': 800,
    'THIRD AC': 800,
    '3A': 800,
    'SLEEPER': 400,
    'SL': 400,
    'GENERAL': 150,
    'UR': 150,
  };

  for (const [key, fare] of Object.entries(fares)) {
    if (typeStr.includes(key)) {
      return fare;
    }
  }

  // Default fare for unknown types
  return 500;
}

/**
 * Optimize travel using real train data
 * 
 * @param {Object} params - Optimization parameters
 * @param {string} params.from - Source city
 * @param {string} params.to - Destination city
 * @param {number} params.budget - Total budget
 * @param {string} params.date - Optional travel date
 * @param {string} params.preference - 'budget' or 'speed'
 * @returns {Promise<Object>} Optimized travel plan
 */
async function optimizeWithRealTrains(params) {
  try {
    const { from, to, budget, date, preference = 'budget' } = params;

    let selectedTransports;

    if (preference === 'speed') {
      selectedTransports = await getFastestTrainsForJourney(from, to, date);
    } else {
      selectedTransports = await getBestTrainsForBudget(from, to, date);
    }

    if (!selectedTransports.success) {
      return {
        success: false,
        transport: null,
        recommendation: selectedTransports.data,
      };
    }

    // Filter trains within budget
    const affordableTrains = selectedTransports.data.filter(
      (train) => train.estimated_cost <= budget * 0.4 // 40% of budget for transport
    );

    if (affordableTrains.length === 0) {
      return {
        success: false,
        transport: null,
        recommendation: `No trains available within 40% of budget (₹${budget * 0.4})`,
        closest_option: selectedTransports.data[0],
      };
    }

    const selectedTrain = affordableTrains[0];

    return {
      success: true,
      transport: selectedTrain,
      all_options: affordableTrains.slice(0, 5),
      budget_allocated: selectedTrain.estimated_cost,
      recommendation: `Selected ${selectedTrain.train_name} (${selectedTrain.train_no}) - ${selectedTrain.departure} to ${selectedTrain.arrival}`,
    };
  } catch (error) {
    console.error('Error optimizing with real trains:', error.message);
    return {
      success: false,
      transport: null,
      recommendation: `Error: ${error.message}`,
    };
  }
}

/**
 * Format train information for display
 * 
 * @param {Object} train - Train object
 * @returns {string} Formatted train info
 */
function formatTrainInfo(train) {
  return `${train.train_name} (${train.train_no}) - Departs: ${train.departure}, Arrives: ${train.arrival}, Duration: ${train.duration}`;
}

module.exports = {
  getBestTrainsForBudget,
  getFastestTrainsForJourney,
  optimizeWithRealTrains,
  estimateFareByClass,
  formatTrainInfo,
};
