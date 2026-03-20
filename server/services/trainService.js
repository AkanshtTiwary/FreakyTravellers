/**
 * Enhanced Indian Rail Service
 * Fetches real train data between stations with optimized caching and parsing
 */

const RailPrettify = require('../utils/railPrettify');
const UserAgent = require('user-agents');

const prettify = new RailPrettify();

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
    };
  } catch (error) {
    console.error('Error fetching trains between stations:', error.message);
    return {
      success: false,
      data: `Error: ${error.message}`,
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
    };
  } catch (error) {
    console.error('Error getting trains on date:', error.message);
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
    console.error('Error fetching train info:', error.message);
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
    console.error('Error fetching train route:', error.message);
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
};
