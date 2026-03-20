/**
 * Indian Rail Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches real train data between two stations from erail.in,
 * using the same approach as github.com/AniCrad/indian-rail-api.
 *
 * Usage:
 *   const { getTrainsBetweenCities } = require('./services/indianRailService');
 *   const trains = await getTrainsBetweenCities('Delhi', 'Goa');
 */

const https = require('https');

// ─────────────────────────────────────────────────────────────────────────────
// Station code lookup table
// Maps city names (lowercase) → IRCTC/erail station codes
// ─────────────────────────────────────────────────────────────────────────────
const STATION_CODES = {
  // North India
  'delhi': 'NDLS',
  'new delhi': 'NDLS',
  'delhi cantt': 'DEC',
  'old delhi': 'DLI',
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

  // West India
  'mumbai': 'LTT',          // Lokmanya Tilak Terminus — most trains from rest of India
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

  // Goa
  'goa': 'MAO',
  'madgaon': 'MAO',
  'margao': 'MAO',
  'panaji': 'MAO',
  'vasco': 'VSG',
  'thivim': 'THVM',

  // South India
  'bangalore': 'SBC',
  'bengaluru': 'SBC',
  'mysore': 'MYS',
  'mysuru': 'MYS',
  'chennai': 'MAS',
  'chennai central': 'MAS',
  'hyderabad': 'HYB',
  'secunderabad': 'SC',
  'coimbatore': 'CBE',
  'kochi': 'ERN',
  'ernakulam': 'ERN',
  'thiruvananthapuram': 'TVC',
  'trivandrum': 'TVC',
  'madurai': 'MDU',
  'visakhapatnam': 'VSKP',
  'vijayawada': 'BZA',

  // East India
  'kolkata': 'KOAA',
  'howrah': 'HWH',
  'sealdah': 'SDAH',
  'bhubaneswar': 'BBS',
  'patna': 'PNBE',
  'guwahati': 'GHY',
  'darjeeling': 'DJ',
  'new jalpaiguri': 'NJP',
  'siliguri': 'SGUJ',

  // Central India
  'bhopal': 'BPL',
  'indore': 'INDB',
  'nagpur': 'NGP',
  'raipur': 'R',
  'jabalpur': 'JBP',
};

/**
 * Resolve a city name to a station code.
 * @param {string} city
 * @returns {string|null} station code or null if not found
 */
function resolveStationCode(city) {
  if (!city) return null;
  const key = city.trim().toLowerCase();
  return STATION_CODES[key] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper (simple GET, no deps)
// ─────────────────────────────────────────────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse erail.in response (ported from AniCrad/indian-rail-api prettify.js)
// ─────────────────────────────────────────────────────────────────────────────
function parseTrainList(rawText) {
  try {
    // Check for error responses
    if (!rawText || rawText.includes('Please try again after some time')
      || rawText.includes('From station not found')
      || rawText.includes('To station not found')) {
      return [];
    }

    const chunks = rawText.split('~~~~~~~~').filter(Boolean);
    const trains = [];

    for (const chunk of chunks) {
      const parts = chunk.split('~^');
      if (parts.length !== 2) continue;
      const fields = parts[1].split('~').filter(Boolean);
      if (fields.length < 13) continue;

      trains.push({
        trainNo:      fields[0],
        trainName:    fields[1],
        departureFrom: fields[6],   // from_stn_name
        fromCode:     fields[7],    // from_stn_code
        arrivalAt:    fields[8],    // to_stn_name
        toCode:       fields[9],    // to_stn_code
        departureTime: fields[10],  // from_time  e.g. "16:55"
        arrivalTime:  fields[11],   // to_time    e.g. "08:35"
        travelTime:   fields[12],   // travel_time e.g. "15:40"
        runningDays:  fields[13],   // 7-char bitmask
      });
    }

    return trains;
  } catch (err) {
    console.warn('[IndianRailService] parse error:', err.message);
    return [];
  }
}

/**
 * Check if the 'No direct trains found' message is in the response.
 */
function hasNoTrains(rawText) {
  const first = rawText.split('~~~~~~~~')[0]?.split('~');
  return first?.[5]?.includes('No direct trains found') ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch trains between two city names using erail.in data.
 * Returns an array of train objects (empty array on failure).
 *
 * @param {string} sourceCity  - e.g. "Delhi"
 * @param {string} destCity    - e.g. "Goa"
 * @returns {Promise<Array>}
 */
async function getTrainsBetweenCities(sourceCity, destCity) {
  const fromCode = resolveStationCode(sourceCity);
  const toCode   = resolveStationCode(destCity);

  if (!fromCode || !toCode) {
    console.log(`[IndianRailService] Unknown station for "${sourceCity}" or "${destCity}" — skipping rail lookup`);
    return [];
  }

  const url = `https://erail.in/rail/getTrains.aspx?Station_From=${fromCode}&Station_To=${toCode}&DataSource=0&Language=0&Cache=true`;

  try {
    console.log(`[IndianRailService] Fetching trains ${fromCode} → ${toCode}…`);
    const rawText = await httpGet(url);

    if (hasNoTrains(rawText)) {
      console.log(`[IndianRailService] No direct trains between ${fromCode} → ${toCode}`);
      return [];
    }

    const trains = parseTrainList(rawText);
    console.log(`[IndianRailService] Found ${trains.length} trains between ${fromCode} → ${toCode}`);
    return trains;
  } catch (err) {
    console.warn('[IndianRailService] Fetch error:', err.message);
    return [];
  }
}

/**
 * Build a human-readable block of real train data for AI prompt injection.
 * Returns null if no data available.
 *
 * @param {string} source
 * @param {string} destination
 * @returns {Promise<string|null>}
 */
async function buildRailContext(source, destination) {
  const trains = await getTrainsBetweenCities(source, destination);
  if (!trains.length) return null;

  // Pick up to 4 most relevant trains
  const sample = trains.slice(0, 4);

  const lines = [
    `LIVE TRAIN DATA for ${source} → ${destination} (source: Indian Railways / erail.in):`,
    '(Use these EXACT train names and numbers in your transportOptions — real verified data)',
    '',
    'TRAIN OPTIONS:',
  ];

  for (const t of sample) {
    const duration = t.travelTime.replace(':', 'h ') + 'm';
    lines.push(
      `  • ${t.trainName} (${t.trainNo}): Dep ${t.departureTime} → Arr ${t.arrivalTime} (${duration}). Booking: book at irctc.co.in`
    );
  }

  lines.push('');
  lines.push('NOTE: Prices vary by class (Sleeper ≈ ₹200-600, 3AC ≈ ₹600-1800, 2AC ≈ ₹900-2500). Use these to suggest appropriate class based on budget tier.');

  return lines.join('\n');
}

module.exports = { getTrainsBetweenCities, buildRailContext, resolveStationCode };
