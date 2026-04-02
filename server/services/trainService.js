/**
 * Enhanced Indian Rail Service
 * Fetches real train data between stations with optimized caching and parsing
 */

const RailPrettify = require('../utils/railPrettify');
const UserAgent = require('user-agents');
const TTLCache = require('../utils/cache');
const logger = require('../utils/logger');

const prettify = new RailPrettify();

// ──────────────────────────────────────────────────────────────────────────────
// Cache Configuration & Management (using centralized TTL cache utility)
// ──────────────────────────────────────────────────────────────────────────────
const trainCache = new TTLCache(30); // 30 minute TTL

/**
 * Generate cache key for route
 */
function getCacheKey(fromCode, toCode) {
  return `${fromCode}|${toCode}`;
}

/**
 * Get from cache
 */
function getFromCache(fromCode, toCode) {
  const key = getCacheKey(fromCode, toCode);
  const cached = trainCache.get(key);
  
  if (cached) {
    logger.debug(`Cache hit for ${fromCode} → ${toCode}`);
    return cached;
  }
  
  return null;
}

/**
 * Store in cache
 */
function setInCache(fromCode, toCode, data) {
  const key = getCacheKey(fromCode, toCode);
  trainCache.set(key, data);
}

/**
 * Multi-hop routing table for common routes with no direct trains
 * Uses intermediate stations to find routes when direct service unavailable
 */
const MULTI_HOP_ROUTES = {
  'PGA|ASR': ['LDH', 'JRC'],     // Phagwara → (Ludhiana or Jalandhar) → Amritsar
  'ASR|PGA': ['LDH', 'JRC'],     // Amritsar → (Ludhiana or Jalandhar) → Phagwara
};

// ──────────────────────────────────────────────────────────────────────────────
// Extended Station Code Mapping
// ──────────────────────────────────────────────────────────────────────────────
const STATION_CODES = {
  // North India
  'delhi': 'NDLS',
  'new delhi': 'NDLS',
  'delhi cantt': 'DEC',
  'old delhi': 'DLI',
  'delhi junction': 'NDLS',
  'agra': 'AGC',
  'agra cantt': 'AGC',
  'agra city': 'AF',
  'mathura': 'MTJ',
  'jaipur': 'JP',
  'chandigarh': 'CDG',
  'amritsar': 'ASR',
  'lucknow': 'LKO',
  'varanasi': 'BCY',
  'allahabad': 'ALD',
  'prayagraj': 'ALD',
  'kanpur': 'CNB',
  'dehradun': 'DDN',
  'haridwar': 'HW',
  'roorkee': 'RK',
  'saharanpur': 'SHP',
  'meerut': 'MRT',
  'ghaziabad': 'GZB',
  'noida': 'NDLS',
  'phagwara': 'PGA',
  'jalandhar': 'JRC',
  'jalandhar city': 'JRC',
  'ludhiana': 'LDH',
  'amritsar': 'ASR',
  'pathankot': 'PTK',
  'gorakhpur': 'GKP',
  'mughalsarai': 'MGS',
  'mughal sarai': 'MGS',

  // West India
  'mumbai': 'LTT',
  'mumbai ltt': 'LTT',
  'mumbai cst': 'CSTM',
  'mumbai csmt': 'CSTM',
  'mumbai central': 'BCT',
  'lokmanya tilak': 'LTT',
  'bandra': 'BDTS',
  'pune': 'PUNE',
  'nashik': 'NK',
  'surat': 'ST',
  'ahmedabad': 'ADI',
  'vadodara': 'BRC',
  'rajkot': 'RJT',
  'bhavnagar': 'BVC',

  // South India
  'bangalore': 'SBC',
  'bengaluru': 'SBC',
  'hyderabad': 'HYD',
  'secunderabad': 'SC',
  'chennai': 'MAS',
  'madras': 'MAS',
  'kochi': 'KOCHI',
  'trivandrum': 'TVM',
  'thiruvananthapuram': 'TVM',
  'kurnool': 'KNL',
  'vijayawada': 'VJA',
  'visakhapatnam': 'VSKP',
  'salem': 'SA',
  'coimbatore': 'CBE',

  // East India
  'kolkata': 'KOAA',
  'calcutta': 'KOAA',
  'howrah': 'HWH',
  'patna': 'PNBE',
  'gaya': 'GAYA',
  'ranchi': 'RNC',
  'bhubaneswar': 'BBS',
  'visakhapatnam': 'VSKP',
  'sambalpur': 'SAMB',

  // Central India
  'indore': 'INDB',
  'jabalpur': 'JBP',
  'bhopal': 'BPL',
  'gwalior': 'GWL',
  'ujjain': 'UJN',
};

/**
 * Map station code to standard city name
 * @private
 */
function getStationCityName(stationCode) {
  const codeToCity = {
    'NDLS': 'delhi',
    'DEC': 'delhi cantt',
    'DLI': 'old delhi',
    'AGC': 'agra',
    'AF': 'agra city',
    'MTJ': 'mathura',
    'JP': 'jaipur',
    'CDG': 'chandigarh',
    'ASR': 'amritsar',
    'LKO': 'lucknow',
    'BCY': 'varanasi',
    'ALD': 'allahabad',
    'CNB': 'kanpur',
    'DDN': 'dehradun',
    'HW': 'haridwar',
    'RK': 'roorkee',
    'SHP': 'saharanpur',
    'MRT': 'meerut',
    'GZB': 'ghaziabad',
    'PGA': 'phagwara',
    'JRC': 'jalandhar',
    'LDH': 'ludhiana',
    'PTK': 'pathankot',
    'GKP': 'gorakhpur',
    'MGS': 'mughalsarai',
    'LTT': 'mumbai',
    'CSTM': 'mumbai cst',
    'BCT': 'mumbai central',
    'BDTS': 'bandra',
    'PUNE': 'pune',
    'NK': 'nashik',
    'ST': 'surat',
    'ADI': 'ahmedabad',
    'BRC': 'vadodara',
    'RJT': 'rajkot',
    'BVC': 'bhavnagar',
    'SBC': 'bangalore',
    'HYD': 'hyderabad',
    'SC': 'secunderabad',
    'MAS': 'chennai',
    'KOCHI': 'kochi',
    'TVM': 'trivandrum',
    'KNL': 'kurnool',
    'VJA': 'vijayawada',
    'VSKP': 'visakhapatnam',
    'SA': 'salem',
    'CBE': 'coimbatore',
    'KOAA': 'kolkata',
    'HWH': 'howrah',
    'PNBE': 'patna',
    'GAYA': 'gaya',
    'RNC': 'ranchi',
    'BBS': 'bhubaneswar',
    'SAMB': 'sambalpur',
    'INDB': 'indore',
    'JBP': 'jabalpur',
    'BPL': 'bhopal',
    'GWL': 'gwalior',
    'UJN': 'ujjain',
  };
  return codeToCity[stationCode] || stationCode;
}

/**
 * Get station code from city name
 * @param {string} cityName - City name
 * @returns {string|null} Station code or null
 */
function getStationCode(cityName) {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase().trim();
  return STATION_CODES[normalized] || null;
}

/**
 * Fetch trains between two stations using erail.in API
 * @param {string} fromCity - Source city name
 * @param {string} toCity - Destination city name
 * @returns {Promise<Object>} Train data
 */
async function getTrainsBetweenStations(fromCity, toCity) {
  try {
    const fromCode = getStationCode(fromCity);
    const toCode = getStationCode(toCity);

    if (!fromCode || !toCode) {
      return {
        success: false,
        data: `Invalid stations. From: ${fromCity} (${fromCode}), To: ${toCity} (${toCode})`,
        timestamp: Date.now(),
      };
    }

    // Check cache first
    const cachedResult = getFromCache(fromCode, toCode);
    if (cachedResult) {
      return cachedResult;
    }

    // Fetch direct trains
    const directResult = await fetchDirectTrains(fromCode, toCode, fromCity, toCity);

    if (directResult.success && directResult.data && directResult.data.length > 0) {
      // Cache successful direct route
      setInCache(fromCode, toCode, directResult);
      return directResult;
    }

    // If no direct trains, try multi-hop routing
    logger.debug(`No direct trains found. Attempting multi-hop routing for ${fromCity} → ${toCity}`);
    const multiHopResult = await getMultiHopTrains(fromCode, toCode, fromCity, toCity);

    if (multiHopResult.success) {
      // Cache multi-hop result
      setInCache(fromCode, toCode, multiHopResult);
      return multiHopResult;
    }

    // Return direct result even if empty (preserves original error message)
    setInCache(fromCode, toCode, directResult);
    return directResult;
  } catch (error) {
    logger.error('Error fetching trains between stations: ' + error.message);
    return {
      success: false,
      data: `Error: ${error.message}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Fetch direct trains between two stations
 * @private
 */
async function fetchDirectTrains(fromCode, toCode, fromCity, toCity) {
  try {
    const url = `https://erail.in/rail/getTrains.aspx?Station_From=${fromCode}&Station_To=${toCode}&DataSource=0&Language=0&Cache=true`;

    const userAgent = new UserAgent();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent.toString(),
      },
      timeout: 10000,
    });

    if (!response.ok) {
      return {
        success: false,
        data: `HTTP Error: ${response.status}`,
        timestamp: Date.now(),
      };
    }

    const htmlData = await response.text();
    const parsedData = prettify.betweenStation(htmlData);

    return {
      ...parsedData,
      from_city: fromCity,
      to_city: toCity,
      from_code: fromCode,
      to_code: toCode,
      is_direct: true,
    };
  } catch (error) {
    return {
      success: false,
      data: `Error: ${error.message}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get trains via multi-hop routing when no direct trains available
 * @private
 */
async function getMultiHopTrains(fromCode, toCode, fromCity, toCity) {
  try {
    const routeKey = `${fromCode}|${toCode}`;
    const intermediateStations = MULTI_HOP_ROUTES[routeKey];

    if (!intermediateStations || intermediateStations.length === 0) {
      return {
        success: false,
        data: `No direct or multi-hop routes available between ${fromCity} and ${toCity}`,
        timestamp: Date.now(),
      };
    }

    const allMultiHopTrains = [];
    let validRouteFound = false;

    // Try each intermediate station
    for (const intermediateCode of intermediateStations) {
      // Get intermediate station city name
      const intermediateCity = getStationCityName(intermediateCode);

      logger.debug(`Trying route: ${fromCity} → ${intermediateCity} → ${toCity}`);

      // Fetch first leg: from → intermediate
      const leg1 = await fetchDirectTrains(fromCode, intermediateCode, fromCity, intermediateCity);

      if (!leg1.success || !leg1.data || leg1.data.length === 0) {
        logger.debug(`No trains for ${fromCity} → ${intermediateCity}`);
        continue;
      }

      // Fetch second leg: intermediate → to
      const leg2 = await fetchDirectTrains(intermediateCode, toCode, intermediateCity, toCity);

      if (!leg2.success || !leg2.data || leg2.data.length === 0) {
        logger.debug(`No trains for ${intermediateCity} → ${toCity}`);
        continue;
      }

      validRouteFound = true;
      logger.debug(`Found ${leg1.data.length} trains (${fromCity}→${intermediateCity}) and ${leg2.data.length} trains (${intermediateCity}→${toCity})`);


      // Combine multi-hop trains with metadata
      allMultiHopTrains.push({
        intermediate_station: intermediateCity,
        intermediate_code: intermediateCode,
        leg1: leg1.data,
        leg2: leg2.data,
      });
    }

    if (!validRouteFound) {
      return {
        success: false,
        data: `No multi-hop routes available between ${fromCity} and ${toCity}`,
        timestamp: Date.now(),
      };
    }

    return {
      success: true,
      data: allMultiHopTrains,
      from_city: fromCity,
      to_city: toCity,
      from_code: fromCode,
      to_code: toCode,
      is_direct: false,
      is_multi_hop: true,
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Error in multi-hop routing: ' + error.message);
    return {
      success: false,
      data: `Error in multi-hop routing: ${error.message}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get trains on a specific date
 * @param {string} fromCity - Source city
 * @param {string} toCity - Destination city
 * @param {string} date - Date in DD-MM-YYYY format
 * @returns {Promise<Object>} Filtered train data
 */
async function getTrainsOnDate(fromCity, toCity, date) {
  try {
    if (!date) {
      return {
        success: false,
        data: 'Please provide date in DD-MM-YYYY format',
        timestamp: Date.now(),
      };
    }

    const trainsData = await getTrainsBetweenStations(fromCity, toCity);

    if (!trainsData.success || !trainsData.data) {
      return trainsData;
    }

    const [DD, MM, YYYY] = date.split('-');
    const dayOfWeek = prettify.getDayOnDate(DD, MM, YYYY);

    // Handle multi-hop routes
    if (trainsData.is_multi_hop) {
      const filteredMultiHop = trainsData.data.map((route) => ({
        ...route,
        leg1: route.leg1.filter((train) => {
          if (train.train_base && train.train_base.running_days) {
            const runningDays = train.train_base.running_days;
            return runningDays[dayOfWeek] === '1' || runningDays[dayOfWeek] === 1;
          }
          return false;
        }),
        leg2: route.leg2.filter((train) => {
          if (train.train_base && train.train_base.running_days) {
            const runningDays = train.train_base.running_days;
            return runningDays[dayOfWeek] === '1' || runningDays[dayOfWeek] === 1;
          }
          return false;
        }),
      }));

      return {
        success: true,
        data: filteredMultiHop,
        date,
        day_of_week: dayOfWeek,
        timestamp: Date.now(),
        from_city: fromCity,
        to_city: toCity,
        is_multi_hop: true,
      };
    }

    // Handle direct routes
    const filteredTrains = trainsData.data.filter((train) => {
      if (train.train_base && train.train_base.running_days) {
        const runningDays = train.train_base.running_days;
        return runningDays[dayOfWeek] === '1' || runningDays[dayOfWeek] === 1;
      }
      return false;
    });

    return {
      success: true,
      data: filteredTrains,
      date,
      day_of_week: dayOfWeek,
      timestamp: Date.now(),
      from_city: fromCity,
      to_city: toCity,
      is_multi_hop: false,
    };
  } catch (error) {
    logger.error('Error getting trains on date: ' + error.message);
    return {
      success: false,
      data: `Error: ${error.message}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get detailed train information by train number
 * @param {string} trainNumber - Train number
 * @returns {Promise<Object>} Train details
 */
async function getTrainInfo(trainNumber) {
  try {
    const url = `https://erail.in/rail/getTrains.aspx?TrainNo=${trainNumber}&DataSource=0&Language=0&Cache=true`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': new UserAgent().toString(),
      },
      timeout: 10000,
    });

    if (!response.ok) {
      return {
        success: false,
        data: `HTTP Error: ${response.status}`,
        timestamp: Date.now(),
      };
    }

    const htmlData = await response.text();
    return prettify.checkTrain(htmlData);
  } catch (error) {
    logger.error('Error fetching train info: ' + error.message);
    return {
      success: false,
      data: `Error: ${error.message}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Get complete route of a train
 * @param {string} trainNumber - Train number
 * @returns {Promise<Object>} Train route data
 */
async function getTrainRoute(trainNumber) {
  try {
    // First get train info to get train ID
    const trainInfoUrl = `https://erail.in/rail/getTrains.aspx?TrainNo=${trainNumber}&DataSource=0&Language=0&Cache=true`;

    let response = await fetch(trainInfoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': new UserAgent().toString(),
      },
      timeout: 10000,
    });

    if (!response.ok) {
      return {
        success: false,
        data: `HTTP Error: ${response.status}`,
        timestamp: Date.now(),
      };
    }

    let htmlData = await response.text();
    const trainInfo = prettify.checkTrain(htmlData);

    if (!trainInfo.success) {
      return trainInfo;
    }

    // Get route using train ID
    const routeUrl = `https://erail.in/data.aspx?Action=TRAINROUTE&Password=2012&Data1=${trainInfo.data.train_id}&Data2=0&Cache=true`;

    response = await fetch(routeUrl, {
      method: 'GET',
      headers: {
        'User-Agent': new UserAgent().toString(),
      },
      timeout: 10000,
    });

    if (!response.ok) {
      return {
        success: false,
        data: `HTTP Error: ${response.status}`,
        timestamp: Date.now(),
      };
    }

    htmlData = await response.text();
    const routeData = prettify.getRoute(htmlData);

    return {
      ...routeData,
      train_number: trainNumber,
      train_name: trainInfo.data.train_name,
    };
  } catch (error) {
    logger.error('Error fetching train route: ' + error.message);
    return {
      success: false,
      data: `Error: ${error.message}`,
      timestamp: Date.now(),
    };
  }
}

/**
 * Filter trains by price/class
 * @param {Array} trains - Train array
 * @param {string} classType - Train class (1A, 2A, 3A, SL, etc.)
 * @returns {Array} Filtered trains
 */
function filterTrainsByClass(trains, classType) {
  // This would require additional data fetch for fare info
  // For now, filter by train type/class inference
  return trains.filter((train) => {
    const trainType = train.train_base?.type || '';
    return trainType.includes(classType);
  });
}

/**
 * Sort trains by travel time
 * @param {Array} trains - Train array
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted trains
 */
function sortTrainsByTime(trains, order = 'asc') {
  return [...trains].sort((a, b) => {
    const timeA = a.train_base?.travel_time || '';
    const timeB = b.train_base?.travel_time || '';

    const parseTime = (timeStr) => {
      try {
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } catch {
        return 0;
      }
    };

    const minA = parseTime(timeA);
    const minB = parseTime(timeB);

    return order === 'asc' ? minA - minB : minB - minA;
  });
}

/**
 * Sort trains by departure time
 * @param {Array} trains - Train array
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted trains
 */
function sortTrainsByDeparture(trains, order = 'asc') {
  return [...trains].sort((a, b) => {
    const timeA = a.train_base?.from_time || '';
    const timeB = b.train_base?.from_time || '';

    const parseTime = (timeStr) => {
      try {
        const parts = timeStr.replace('h', '').replace('m', '').trim().split(':');
        return parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0);
      } catch {
        return 0;
      }
    };

    const minA = parseTime(timeA);
    const minB = parseTime(timeB);

    return order === 'asc' ? minA - minB : minB - minA;
  });
}

module.exports = {
  getTrainsBetweenStations,
  getTrainsOnDate,
  getTrainInfo,
  getTrainRoute,
  filterTrainsByClass,
  sortTrainsByTime,
  sortTrainsByDeparture,
  getStationCode,
  STATION_CODES,
  // Cache management
  clearCache: () => trainCache.clear(),
  getCacheStats: () => ({
    size: trainCache.size,
    entries: Array.from(trainCache.keys()),
  }),
};
