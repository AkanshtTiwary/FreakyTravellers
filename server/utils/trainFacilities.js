/**
 * Train Facilities Checker
 * Extracts and provides train amenities and facilities information
 */

/**
 * Train facilities/amenities mapping
 * Common amenities available on Indian trains
 */
const TRAIN_FACILITIES = {
  // AC Categories
  AC_FIRST: {
    code: '1A',
    name: 'First AC',
    comfort: 'Premium',
    facilities: ['AC', 'Personal Berth', 'Bedding', 'Meals', 'WiFi', 'Charging', 'Toilet', 'Pantry'],
    capacity: 18,
    price_factor: 1.0
  },
  AC_SECOND: {
    code: '2A',
    name: 'Second AC',
    comfort: 'High',
    facilities: ['AC', 'Shared Berth', 'Bedding', 'Meals', 'WiFi', 'Charging', 'Toilet', 'Pantry'],
    capacity: 48,
    price_factor: 0.5
  },
  AC_THIRD: {
    code: '3A',
    name: 'Third AC',
    comfort: 'Medium',
    facilities: ['AC', 'Shared Berth', 'Basic Bedding', 'WiFi', 'Charging (Limited)', 'Toilet', 'Pantry'],
    capacity: 72,
    price_factor: 0.27
  },
  SLEEPER: {
    code: 'SL',
    name: 'Sleeper',
    comfort: 'Budget',
    facilities: ['Open Berth', 'Toilet', 'Pantry', 'Basic WiFi'],
    capacity: 96,
    price_factor: 0.13
  },
  GENERAL: {
    code: 'UR',
    name: 'General/Unreserved',
    comfort: 'Basic',
    facilities: ['Unreserved Seat', 'Toilet', 'Basic Amenities'],
    capacity: 200,
    price_factor: 0.05
  }
};

/**
 * Train type to typical facilities mapping
 */
const TRAIN_TYPE_FACILITIES = {
  'RAJDHANI': {
    type: 'Express',
    speed: 'High Speed',
    typical_classes: ['1A', '2A', 'FC (First Class)'],
    amenities: {
      dining: 'Full Dining Service',
      food: 'Complimentary Meals',
      wifi: 'Yes',
      charging: 'Multiple Points',
      bedding: 'Complimentary',
      pantry: 'Premium'
    }
  },
  'SHATABDI': {
    type: 'Express',
    speed: 'High Speed Day Train',
    typical_classes: ['AC 1', 'AC 2', 'Chair Car'],
    amenities: {
      dining: 'Dining Car',
      food: 'Complimentary Meals',
      wifi: 'Yes',
      charging: 'Available',
      bedding: 'N/A',
      pantry: 'Pantry Available'
    }
  },
  'EXPRESS': {
    type: 'Regular',
    speed: 'Normal',
    typical_classes: ['1A', '2A', '3A', 'SL', 'UR'],
    amenities: {
      dining: 'Pantry Only',
      food: 'Paid Food Service',
      wifi: 'Limited',
      charging: 'Limited',
      bedding: 'Paid Bedding',
      pantry: 'Basic'
    }
  },
  'LOCAL': {
    type: 'Commuter',
    speed: 'Regular Stops',
    typical_classes: ['UR', 'SL'],
    amenities: {
      dining: 'None',
      food: 'No Service',
      wifi: 'No',
      charging: 'No',
      bedding: 'N/A',
      pantry: 'None'
    }
  }
};

/**
 * Get facilities by train class
 * @param {string} classCode - Train class code (1A, 2A, 3A, SL, UR)
 * @returns {Object} Facilities for that class
 */
function getFacilitiesByClass(classCode) {
  const normalizedCode = classCode ? classCode.toUpperCase() : '';
  
  for (const [key, facility] of Object.entries(TRAIN_FACILITIES)) {
    if (facility.code === normalizedCode) {
      return facility;
    }
  }
  
  return {
    code: classCode,
    name: 'Unknown Class',
    comfort: 'Unknown',
    facilities: [],
    capacity: 0,
    price_factor: 0
  };
}

/**
 * Get facilities by train type/name
 * @param {string} trainName - Train name (e.g., RAJDHANI, SHATABDI)
 * @returns {Object} Typical facilities for that train type
 */
function getFacilitiesByTrainType(trainName) {
  if (!trainName) {
    return null;
  }

  const upperName = trainName.toUpperCase();

  // Check exact match first
  if (TRAIN_TYPE_FACILITIES[upperName]) {
    return TRAIN_TYPE_FACILITIES[upperName];
  }

  // Check partial matches
  if (upperName.includes('RAJDHANI')) {
    return TRAIN_TYPE_FACILITIES['RAJDHANI'];
  }
  if (upperName.includes('SHATABDI')) {
    return TRAIN_TYPE_FACILITIES['SHATABDI'];
  }
  if (upperName.includes('EXPRESS')) {
    return TRAIN_TYPE_FACILITIES['EXPRESS'];
  }
  if (upperName.includes('LOCAL') || upperName.includes('PASSENGER')) {
    return TRAIN_TYPE_FACILITIES['LOCAL'];
  }

  // Default to EXPRESS for unknown types
  return TRAIN_TYPE_FACILITIES['EXPRESS'];
}

/**
 * Get comprehensive facilities for a train
 * @param {Object} train - Train object with train_base
 * @returns {Object} Complete facilities information
 */
function getTrainFacilities(train) {
  if (!train || !train.train_base) {
    return null;
  }

  const base = train.train_base;
  const trainName = base.train_name || '';
  const trainType = base.type || 'EXPRESS';

  // Get type-based facilities
  const typeFacilities = getFacilitiesByTrainType(trainName);

  // Get class-based facilities (inferred from type if available)
  const estimatedClasses = typeFacilities?.typical_classes || ['1A', '2A', '3A', 'SL'];
  const classFacilities = estimatedClasses.map(cls => getFacilitiesByClass(cls));

  return {
    train_no: base.train_no,
    train_name: trainName,
    train_type: trainType,
    type_info: typeFacilities,
    available_classes: classFacilities,
    amenities: typeFacilities?.amenities || {},
  };
}

/**
 * Check if train has specific facility
 * @param {string} trainType - Train type/name
 * @param {string} facility - Facility to check (wifi, charging, meals, etc.)
 * @returns {boolean} Whether train has the facility
 */
function checkFacility(trainType, facility) {
  const facilities = getFacilitiesByTrainType(trainType);
  if (!facilities || !facilities.amenities) {
    return false;
  }

  const normalizedFacility = facility.toLowerCase();
  const amenities = facilities.amenities;

  // Check various facility keywords
  for (const [key, value] of Object.entries(amenities)) {
    if (key.toLowerCase().includes(normalizedFacility)) {
      return value !== 'No' && value !== 'None' && value !== 'N/A';
    }
  }

  return false;
}

/**
 * Get user-friendly facilities summary
 * @param {Object} train - Train object
 * @returns {string} Human readable facilities description
 */
function getFacilitiesSummary(train) {
  if (!train || !train.train_base) {
    return 'No information available';
  }

  const facilities = getTrainFacilities(train);
  const amenities = facilities.amenities;

  let summary = `${facilities.train_name} (${facilities.train_type}):\n`;
  summary += `\n✨ Amenities:\n`;

  if (amenities.dining) {
    summary += `  🍽️  Dining: ${amenities.dining}\n`;
  }
  if (amenities.food) {
    summary += `  🍲 Food: ${amenities.food}\n`;
  }
  if (amenities.wifi) {
    summary += `  📶 WiFi: ${amenities.wifi}\n`;
  }
  if (amenities.charging) {
    summary += `  🔌 Charging: ${amenities.charging}\n`;
  }
  if (amenities.bedding) {
    summary += `  🛏️  Bedding: ${amenities.bedding}\n`;
  }
  if (amenities.pantry) {
    summary += `  🥤 Pantry: ${amenities.pantry}\n`;
  }

  return summary;
}

/**
 * Compare facilities between multiple trains
 * @param {Array} trains - Array of train objects
 * @returns {Object} Comparison of facilities
 */
function compareFacilities(trains) {
  if (!Array.isArray(trains) || trains.length === 0) {
    return null;
  }

  const comparison = {};

  trains.forEach((train, index) => {
    if (train && train.train_base) {
      const trainName = train.train_base.train_name || `Train ${index + 1}`;
      const facilities = getTrainFacilities(train);
      comparison[trainName] = facilities.amenities;
    }
  });

  return comparison;
}

/**
 * Get facilities by comfort level
 * @param {string} comfortLevel - 'premium', 'high', 'medium', 'budget', 'basic'
 * @returns {Array} All facilities in that comfort level
 */
function getFacilitiesByComfort(comfortLevel) {
  const level = comfortLevel.toLowerCase();
  const result = [];

  for (const facility of Object.values(TRAIN_FACILITIES)) {
    if (facility.comfort.toLowerCase() === level) {
      result.push(facility);
    }
  }

  return result;
}

/**
 * Get best value facilities (comfort vs price)
 * @returns {Object} Best value option
 */
function getBestValueFacilities() {
  let bestValue = null;
  let bestRatio = 0;

  for (const facility of Object.values(TRAIN_FACILITIES)) {
    // Better comfort per unit price = higher ratio
    const comfortScore = Object.keys(TRAIN_FACILITIES)
      .filter(k => TRAIN_FACILITIES[k].comfort !== facility.comfort).length;
    
    const ratio = facility.facilities.length / (facility.price_factor || 1);

    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestValue = facility;
    }
  }

  return bestValue;
}

module.exports = {
  TRAIN_FACILITIES,
  TRAIN_TYPE_FACILITIES,
  getFacilitiesByClass,
  getFacilitiesByTrainType,
  getTrainFacilities,
  checkFacility,
  getFacilitiesSummary,
  compareFacilities,
  getFacilitiesByComfort,
  getBestValueFacilities,
};
