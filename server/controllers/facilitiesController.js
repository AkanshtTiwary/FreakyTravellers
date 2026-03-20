/**
 * Train Facilities Controller
 * Handles endpoints for checking train amenities and facilities
 */

const trainFacilities = require('../utils/trainFacilities');
const trainService = require('../services/trainService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get facilities for a specific train class
 * @route   GET /api/trains/facilities/by-class
 * @query   class={1A|2A|3A|SL|UR}
 * @access  Public
 */
exports.getFacilitiesByClass = asyncHandler(async (req, res) => {
  const { class: trainClass } = req.query;

  if (!trainClass) {
    return res.status(400).json({
      success: false,
      message: 'Please provide train class (1A, 2A, 3A, SL, or UR)',
    });
  }

  const facilities = trainFacilities.getFacilitiesByClass(trainClass);

  if (!facilities || !facilities.facilities.length) {
    return res.status(404).json({
      success: false,
      message: `No facilities found for class: ${trainClass}`,
    });
  }

  res.json({
    success: true,
    message: `Facilities for ${facilities.name} (${facilities.code})`,
    data: {
      code: facilities.code,
      name: facilities.name,
      comfort_level: facilities.comfort,
      facilities: facilities.facilities,
      typical_capacity: facilities.capacity,
      price_factor: facilities.price_factor,
    },
  });
});

/**
 * @desc    Get typical facilities for train type
 * @route   GET /api/trains/facilities/by-type
 * @query   type={train_name|type}
 * @access  Public
 * @example GET /api/trains/facilities/by-type?type=RAJDHANI
 */
exports.getFacilitiesByType = asyncHandler(async (req, res) => {
  const { type } = req.query;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Please provide train type (e.g., RAJDHANI, SHATABDI, EXPRESS)',
    });
  }

  const facilities = trainFacilities.getFacilitiesByTrainType(type);

  if (!facilities) {
    return res.status(404).json({
      success: false,
      message: `No facilities found for type: ${type}`,
    });
  }

  res.json({
    success: true,
    message: `Facilities for ${type} trains`,
    data: {
      type: facilities.type,
      speed: facilities.speed,
      typical_classes: facilities.typical_classes,
      amenities: facilities.amenities,
    },
  });
});

/**
 * @desc    Get all comfort levels and their facilities
 * @route   GET /api/trains/facilities/by-comfort
 * @query   level={premium|high|medium|budget|basic}
 * @access  Public
 */
exports.getFacilitiesByComfort = asyncHandler(async (req, res) => {
  const { level } = req.query;

  if (!level) {
    // Return all comfort levels
    const allFacilities = Object.values(trainFacilities.TRAIN_FACILITIES);
    return res.json({
      success: true,
      message: 'All comfort levels available',
      data: allFacilities.map(f => ({
        comfort: f.comfort,
        name: f.name,
        code: f.code,
        facilities: f.facilities,
        capacity: f.capacity,
      })),
    });
  }

  const facilities = trainFacilities.getFacilitiesByComfort(level);

  if (!facilities || facilities.length === 0) {
    return res.status(404).json({
      success: false,
      message: `No facilities found for comfort level: ${level}`,
      available_levels: ['premium', 'high', 'medium', 'budget', 'basic'],
    });
  }

  res.json({
    success: true,
    message: `Facilities for ${level} comfort level`,
    data: facilities.map(f => ({
      comfort: f.comfort,
      name: f.name,
      code: f.code,
      facilities: f.facilities,
      capacity: f.capacity,
      price_factor: f.price_factor,
    })),
  });
});

/**
 * @desc    Check if train has specific facility
 * @route   GET /api/trains/facilities/check
 * @query   trainType={type} facility={facility_name}
 * @access  Public
 * @example GET /api/trains/facilities/check?trainType=RAJDHANI&facility=wifi
 */
exports.checkSpecificFacility = asyncHandler(async (req, res) => {
  const { trainType, facility } = req.query;

  if (!trainType || !facility) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both trainType and facility',
      example:
        'GET /api/trains/facilities/check?trainType=RAJDHANI&facility=wifi',
    });
  }

  const hasFacility = trainFacilities.checkFacility(trainType, facility);

  res.json({
    success: true,
    train_type: trainType,
    facility: facility,
    has_facility: hasFacility,
    message: hasFacility
      ? `${trainType} trains have ${facility}`
      : `${trainType} trains do not have ${facility}`,
  });
});

/**
 * @desc    Get best value facilities
 * @route   GET /api/trains/facilities/best-value
 * @access  Public
 */
exports.getBestValue = asyncHandler(async (req, res) => {
  const best = trainFacilities.getBestValueFacilities();

  if (!best) {
    return res.status(500).json({
      success: false,
      message: 'Unable to calculate best value',
    });
  }

  res.json({
    success: true,
    message: 'Best value facilities (comfort vs price)',
    data: {
      name: best.name,
      code: best.code,
      comfort: best.comfort,
      facilities: best.facilities,
      price_factor: best.price_factor,
      capacity: best.capacity,
      recommendation: `${best.name} offers the best balance of comfort and affordability`,
    },
  });
});

/**
 * @desc    Get train facilities from search results
 * @route   GET /api/trains/facilities/compare
 * @query   from={city} to={city} date={DD-MM-YYYY}
 * @access  Public
 */
exports.compareFacilities = asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: 'Please provide from and to cities',
    });
  }

  try {
    // Get trains
    let trainsData;
    if (date) {
      trainsData = await trainService.getTrainsOnDate(from, to, date);
    } else {
      trainsData = await trainService.getTrainsBetweenStations(from, to);
    }

    if (!trainsData.success || !trainsData.data) {
      return res.status(400).json({
        success: false,
        message: trainsData.data || 'No trains found',
      });
    }

    // Get facilities for each train
    const facilitiesComparison = trainsData.data.slice(0, 5).map((train) => {
      const facilities = trainFacilities.getTrainFacilities(train);
      return {
        train_no: train.train_base.train_no,
        train_name: train.train_base.train_name,
        departure: train.train_base.from_time,
        arrival: train.train_base.to_time,
        duration: train.train_base.travel_time,
        type_info: facilities.type_info,
        amenities: facilities.amenities,
      };
    });

    res.json({
      success: true,
      message: `Comparing facilities for trains from ${from} to ${to}`,
      from_city: from,
      to_city: to,
      date: date || 'Any date',
      trains: facilitiesComparison,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error comparing facilities: ${error.message}`,
    });
  }
});

/**
 * @desc    Get detailed amenities list
 * @route   GET /api/trains/facilities/amenities
 * @access  Public
 */
exports.getAmenitiesList = asyncHandler(async (req, res) => {
  const amenitiesList = {
    wifi: 'Free WiFi connectivity',
    charging: 'USB/Power charging points',
    meals: 'Complimentary meals',
    bedding: 'Free bedding set',
    pantry: 'Onboard pantry service',
    ac: 'Air-conditioned compartment',
    toilet: 'Modern toilet facilities',
    dining: 'Dining car service',
    wheelchair: 'Wheelchair accessibility',
    luggage: 'Extra luggage allowance',
    entertainment: 'Entertainment system',
    reading_light: 'Individual reading lights',
    locker: 'Personal locker/safe',
    attendant: '24/7 attendant service',
  };

  res.json({
    success: true,
    message: 'Available amenities on Indian trains',
    data: amenitiesList,
    total: Object.keys(amenitiesList).length,
  });
});

/**
 * @desc    All facilities reference
 * @route   GET /api/trains/facilities/all
 * @access  Public
 */
exports.getAllFacilities = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'All train classes and their facilities',
    data: {
      classes: trainFacilities.TRAIN_FACILITIES,
      train_types: trainFacilities.TRAIN_TYPE_FACILITIES,
    },
  });
});
