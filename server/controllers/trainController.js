/**
 * Train Controller
 * Handles all train-related API endpoints
 */

const trainService = require('../services/trainService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get trains between two stations
 * @route   GET /api/trains/between
 * @query   from={city} to={city}
 * @access  Public
 * @example GET /api/trains/between?from=Delhi&to=Mumbai
 */
exports.getTrainsBetweenStations = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both from and to cities',
    });
  }

  console.log(`🚂 Fetching trains: ${from} → ${to}`);

  const result = await trainService.getTrainsBetweenStations(from, to);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
      timestamp: result.timestamp,
    });
  }

  // Check if this is a multi-hop route
  if (result.is_multi_hop) {
    return res.json({
      success: true,
      message: `Found multi-hop routes from ${from} to ${to}`,
      data: result.data,
      from_city: result.from_city,
      to_city: result.to_city,
      from_code: result.from_code,
      to_code: result.to_code,
      route_type: 'multi-hop',
      is_direct: false,
      details: 'Direct trains not available. Showing routes via intermediate stations.',
      timestamp: result.timestamp,
    });
  }

  // Direct route response
  res.json({
    success: true,
    message: `Found ${result.data.length} trains from ${from} to ${to}`,
    data: result.data,
    from_city: result.from_city,
    to_city: result.to_city,
    from_code: result.from_code,
    to_code: result.to_code,
    route_type: 'direct',
    is_direct: true,
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Get trains on a specific date
 * @route   GET /api/trains/on-date
 * @query   from={city} to={city} date={DD-MM-YYYY}
 * @access  Public
 * @example GET /api/trains/on-date?from=Delhi&to=Mumbai&date=22-03-2026
 */
exports.getTrainsOnDate = asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide from, to cities and date (DD-MM-YYYY format)',
    });
  }

  console.log(`🚂 Fetching trains for ${date}: ${from} → ${to}`);

  const result = await trainService.getTrainsOnDate(from, to, date);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
      timestamp: result.timestamp,
    });
  }

  // Handle multi-hop routes
  if (result.is_multi_hop) {
    return res.json({
      success: true,
      message: `Found multi-hop routes for ${date}`,
      data: result.data,
      date: result.date,
      day_of_week: result.day_of_week,
      from_city: result.from_city,
      to_city: result.to_city,
      route_type: 'multi-hop',
      is_direct: false,
      details: `Showing ${result.data.length} multi-hop route option(s) with available trains`,
      timestamp: result.timestamp,
    });
  }

  // Direct route response
  res.json({
    success: true,
    message: `Found ${result.data.length} trains running on ${date}`,
    data: result.data,
    date: result.date,
    day_of_week: result.day_of_week,
    from_city: result.from_city,
    to_city: result.to_city,
    route_type: 'direct',
    is_direct: true,
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Get detailed train information
 * @route   GET /api/trains/info
 * @query   trainNo={number}
 * @access  Public
 * @example GET /api/trains/info?trainNo=12345
 */
exports.getTrainInfo = asyncHandler(async (req, res) => {
  const { trainNo } = req.query;

  if (!trainNo) {
    return res.status(400).json({
      success: false,
      message: 'Please provide train number',
    });
  }

  console.log(`🚂 Fetching info for train: ${trainNo}`);

  const result = await trainService.getTrainInfo(trainNo);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
      timestamp: result.timestamp,
    });
  }

  res.json({
    success: true,
    data: result.data,
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Get train route
 * @route   GET /api/trains/route
 * @query   trainNo={number}
 * @access  Public
 * @example GET /api/trains/route?trainNo=12345
 */
exports.getTrainRoute = asyncHandler(async (req, res) => {
  const { trainNo } = req.query;

  if (!trainNo) {
    return res.status(400).json({
      success: false,
      message: 'Please provide train number',
    });
  }

  console.log(`🚂 Fetching route for train: ${trainNo}`);

  const result = await trainService.getTrainRoute(trainNo);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
      timestamp: result.timestamp,
    });
  }

  const routeStops = result.data.length;
  res.json({
    success: true,
    message: `Train ${result.train_number} (${result.train_name}) has ${routeStops} stops`,
    data: result.data,
    train_number: result.train_number,
    train_name: result.train_name,
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Get cheapest trains between two stations
 * @route   GET /api/trains/cheapest
 * @query   from={city} to={city} date={DD-MM-YYYY}
 * @access  Public
 */
exports.getCheapestTrains = asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: 'Please provide from and to cities',
    });
  }

  console.log(`💰 Finding cheapest trains: ${from} → ${to}`);

  let result;
  if (date) {
    result = await trainService.getTrainsOnDate(from, to, date);
  } else {
    result = await trainService.getTrainsBetweenStations(from, to);
  }

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
      timestamp: result.timestamp,
    });
  }

  const trains = trainService.sortTrainsByTime(result.data, 'asc');
  const topCheapest = trains.slice(0, 5);

  res.json({
    success: true,
    message: `Found ${topCheapest.length} cheapest train options`,
    data: topCheapest,
    total_available: trains.length,
    from_city: from,
    to_city: to,
    date: date || 'Any date',
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Get fastest trains between two stations
 * @route   GET /api/trains/fastest
 * @query   from={city} to={city} date={DD-MM-YYYY}
 * @access  Public
 */
exports.getFastestTrains = asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: 'Please provide from and to cities',
    });
  }

  console.log(`⚡ Finding fastest trains: ${from} → ${to}`);

  let result;
  if (date) {
    result = await trainService.getTrainsOnDate(from, to, date);
  } else {
    result = await trainService.getTrainsBetweenStations(from, to);
  }

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
      timestamp: result.timestamp,
    });
  }

  const trains = trainService.sortTrainsByTime(result.data, 'asc');
  const topFastest = trains.slice(0, 5);

  res.json({
    success: true,
    message: `Found ${topFastest.length} fastest train options`,
    data: topFastest,
    total_available: trains.length,
    from_city: from,
    to_city: to,
    date: date || 'Any date',
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Get early morning trains
 * @route   GET /api/trains/early-morning
 * @query   from={city} to={city} date={DD-MM-YYYY}
 * @access  Public
 */
exports.getEarlyMorningTrains = asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide from, to cities and date (DD-MM-YYYY format)',
    });
  }

  console.log(`🌅 Finding early morning trains: ${from} → ${to}`);

  const result = await trainService.getTrainsOnDate(from, to, date);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
      timestamp: result.timestamp,
    });
  }

  const earlyTrains = result.data.filter((train) => {
    const time = train.train_base?.from_time || '';
    const hour = parseInt(time.split(':')[0]);
    return hour >= 5 && hour < 12; // 5 AM to 12 PM
  });

  const sorted = trainService.sortTrainsByDeparture(earlyTrains, 'asc');

  res.json({
    success: true,
    message: `Found ${sorted.length} early morning trains`,
    data: sorted,
    total_available: result.data.length,
    from_city: from,
    to_city: to,
    date: date,
    time_range: '05:00 - 12:00',
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Get evening trains
 * @route   GET /api/trains/evening
 * @query   from={city} to={city} date={DD-MM-YYYY}
 * @access  Public
 */
exports.getEveningTrains = asyncHandler(async (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide from, to cities and date (DD-MM-YYYY format)',
    });
  }

  console.log(`🌆 Finding evening trains: ${from} → ${to}`);

  const result = await trainService.getTrainsOnDate(from, to, date);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
      timestamp: result.timestamp,
    });
  }

  const eveningTrains = result.data.filter((train) => {
    const time = train.train_base?.from_time || '';
    const hour = parseInt(time.split(':')[0]);
    return hour >= 16 && hour < 24; // 4 PM to 12 AM
  });

  const sorted = trainService.sortTrainsByDeparture(eveningTrains, 'asc');

  res.json({
    success: true,
    message: `Found ${sorted.length} evening trains`,
    data: sorted,
    total_available: result.data.length,
    from_city: from,
    to_city: to,
    date: date,
    time_range: '16:00 - 23:59',
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Search trains with filters
 * @route   GET /api/trains/search
 * @query   from={city} to={city} date={DD-MM-YYYY} sort={departure|arrival|duration}
 * @access  Public
 */
exports.searchTrains = asyncHandler(async (req, res) => {
  const { from, to, date, sort = 'departure' } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: 'Please provide from and to cities',
    });
  }

  console.log(`🔍 Searching trains: ${from} → ${to} | Sort: ${sort}`);

  let result;
  if (date) {
    result = await trainService.getTrainsOnDate(from, to, date);
  } else {
    result = await trainService.getTrainsBetweenStations(from, to);
  }

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.data,
    });
  }

  let sortedTrains = result.data;
  if (sort === 'departure') {
    sortedTrains = trainService.sortTrainsByDeparture(result.data, 'asc');
  } else if (sort === 'duration') {
    sortedTrains = trainService.sortTrainsByTime(result.data, 'asc');
  }

  res.json({
    success: true,
    message: `Found ${sortedTrains.length} trains`,
    data: sortedTrains,
    from_city: from,
    to_city: to,
    date: date || 'Any date',
    sort_by: sort,
    timestamp: result.timestamp,
  });
});

/**
 * @desc    Get available station codes
 * @route   GET /api/trains/stations
 * @access  Public
 */
exports.getStations = asyncHandler(async (req, res) => {
  const stations = Object.entries(trainService.STATION_CODES)
    .map(([city, code]) => ({ city, code }))
    .sort((a, b) => a.city.localeCompare(b.city));

  res.json({
    success: true,
    message: `Available ${stations.length} stations`,
    data: stations,
    timestamp: Date.now(),
  });
});
