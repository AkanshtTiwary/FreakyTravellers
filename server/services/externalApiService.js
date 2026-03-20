/**
 * External API Service
 * 
 * Integrates with external travel APIs:
 * - Amadeus API: Flights and Hotels
 * - Indian Railway API: Train bookings and schedules
 * - Unsplash API: Destination photos (free)
 * 
 * Features:
 * - Real-time flight and hotel availability
 * - Indian railway PNR status and seat availability
 * - Smart caching to reduce API calls
 * - Fallback to estimated data if APIs unavailable
 */

const axios = require('axios');
const trainService = require('./trainService');

// ==================== AMADEUS API AUTHENTICATION ====================

let amadeusAccessToken = null;
let amadeusTokenExpiry = null;

/**
 * Get Amadeus API Access Token
 * Caches token until expiry
 */
const getAmadeusToken = async () => {
  // Return cached token if still valid
  if (amadeusAccessToken && amadeusTokenExpiry && Date.now() < amadeusTokenExpiry) {
    return amadeusAccessToken;
  }

  try {
    const apiKey = process.env.AMADEUS_API_KEY;
    const apiSecret = process.env.AMADEUS_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.log('⚠️ Amadeus API credentials not configured');
      return null;
    }

    const response = await axios.post(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: apiSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    amadeusAccessToken = response.data.access_token;
    // Set expiry to 5 minutes before actual expiry
    amadeusTokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    console.log('✅ Amadeus token obtained');
    return amadeusAccessToken;
  } catch (error) {
    console.log(`❌ Amadeus auth error: ${error.message}`);
    return null;
  }
};

// ==================== AMADEUS FLIGHTS ====================

/**
 * Search for flights using Amadeus API
 * @param {object} params - {origin, destination, departureDate, adults, maxPrice}
 * @returns {Promise<Array>} Flight offers
 */
const searchFlights = async ({
  origin,
  destination,
  departureDate,
  returnDate = null,
  adults = 1,
  maxPrice = null,
  currency = 'INR',
}) => {
  try {
    const token = await getAmadeusToken();

    if (!token) {
      console.log('⚠️ Using fallback flight data');
      return getFallbackFlights({ origin, destination, adults });
    }

    // Convert city names to IATA codes
    const originCode = getCityIATACode(origin);
    const destCode = getCityIATACode(destination);

    // Skip API call if either city is unmapped or same origin/dest
    if (!originCode || !destCode) {
      console.log(`⚠️ No IATA code found for "${!originCode ? origin : destination}", using fallback`);
      return getFallbackFlights({ origin, destination, adults });
    }

    if (originCode === destCode) {
      console.log(`⚠️ Origin and destination map to same IATA code (${originCode}), using fallback`);
      return getFallbackFlights({ origin, destination, adults });
    }

    const params = {
      originLocationCode: originCode,
      destinationLocationCode: destCode,
      departureDate: departureDate || getDefaultDepartureDate(),
      adults: adults,
      currencyCode: currency,
      max: 10, // Return top 10 results
    };

    if (returnDate) {
      params.returnDate = returnDate;
    }

    if (maxPrice) {
      params.maxPrice = maxPrice;
    }

    const response = await axios.get(
      'https://test.api.amadeus.com/v2/shopping/flight-offers',
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    if (response.data.data && response.data.data.length > 0) {
      console.log(`✅ Found ${response.data.data.length} flight offers`);

      // Transform Amadeus response to our format
      return response.data.data.map((offer) => {
        const firstSegment = offer.itineraries[0].segments[0];
        const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];

        return {
          id: offer.id,
          source: origin,
          destination: destination,
          mode: 'flight',
          provider: firstSegment.carrierCode,
          flightNumber: firstSegment.number,
          airline: getAirlineName(firstSegment.carrierCode),
          class: offer.travelerPricings[0].fareDetailsBySegment[0].cabin,
          departure: {
            time: firstSegment.departure.at,
            airport: firstSegment.departure.iataCode,
          },
          arrival: {
            time: lastSegment.arrival.at,
            airport: lastSegment.arrival.iataCode,
          },
          duration: parseDuration(offer.itineraries[0].duration),
          stops: offer.itineraries[0].segments.length - 1,
          price: parseFloat(offer.price.total),
          currency: offer.price.currency,
          totalCost: parseFloat(offer.price.total) * adults,
          seats: offer.numberOfBookableSeats,
          amenities: ['Baggage', 'Meals', 'Entertainment'],
          apiSource: 'amadeus',
        };
      });
    }

    return getFallbackFlights({ origin, destination, adults });
  } catch (error) {
    console.log(`⚠️ Flight API error: ${error.message}`);
    return getFallbackFlights({ origin, destination, adults });
  }
};

/**
 * Get fallback flight data when API unavailable
 */
const getFallbackFlights = ({ origin, destination, adults }) => {
  const basePrice = calculateDistanceBasedPrice(origin, destination, 'flight');

  return [
    {
      source: origin,
      destination: destination,
      mode: 'flight',
      provider: 'IndiGo',
      airline: 'IndiGo',
      class: 'Economy',
      duration: '2h 30m',
      price: basePrice,
      totalCost: basePrice * adults,
      apiSource: 'fallback',
    },
    {
      source: origin,
      destination: destination,
      mode: 'flight',
      provider: 'Air India',
      airline: 'Air India',
      class: 'Economy',
      duration: '2h 45m',
      price: basePrice * 1.15,
      totalCost: basePrice * 1.15 * adults,
      apiSource: 'fallback',
    },
  ];
};

// ==================== AMADEUS HOTELS ====================

/**
 * Search for hotels using Amadeus API
 * @param {object} params - {cityCode, checkInDate, checkOutDate, adults, maxPrice}
 * @returns {Promise<Array>} Hotel offers
 */
const searchHotels = async ({
  cityCode,
  checkInDate,
  checkOutDate,
  adults = 1,
  rooms = 1,
  maxPrice = null,
  currency = 'INR',
}) => {
  try {
    const token = await getAmadeusToken();

    if (!token) {
      console.log('⚠️ Using fallback hotel data');
      return getFallbackHotels({ cityCode, adults });
    }

    const resolvedCityCode = getCityIATACode(cityCode);
    if (!resolvedCityCode) {
      console.log(`⚠️ No IATA code for hotel city "${cityCode}", using fallback`);
      return getFallbackHotels({ cityCode, adults });
    }

    // First, get hotel list in the city
    const hotelListResponse = await axios.get(
      'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city',
      {
        params: {
          cityCode: resolvedCityCode,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    if (!hotelListResponse.data.data || hotelListResponse.data.data.length === 0) {
      return getFallbackHotels({ cityCode, adults });
    }

    // Get hotel IDs (up to 10)
    const hotelIds = hotelListResponse.data.data
      .slice(0, 10)
      .map((hotel) => hotel.hotelId)
      .join(',');

    // Then get hotel offers
    const offersResponse = await axios.get(
      'https://test.api.amadeus.com/v3/shopping/hotel-offers',
      {
        params: {
          hotelIds: hotelIds,
          checkInDate: checkInDate || getDefaultCheckInDate(),
          checkOutDate: checkOutDate || getDefaultCheckOutDate(),
          adults: adults,
          roomQuantity: rooms,
          currency: currency,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    if (offersResponse.data.data && offersResponse.data.data.length > 0) {
      console.log(`✅ Found ${offersResponse.data.data.length} hotel offers`);

      return offersResponse.data.data.map((hotelData) => {
        const offer = hotelData.offers[0]; // Get first offer
        const hotel = hotelData.hotel;

        return {
          id: hotel.hotelId,
          name: hotel.name,
          type: 'hotel',
          location: {
            city: cityCode,
            address: hotel.address?.lines?.[0] || 'Address not available',
            latitude: hotel.latitude,
            longitude: hotel.longitude,
          },
          rating: hotel.rating || 3,
          pricePerNight: parseFloat(offer.price.total) / (offer.price.variations?.average?.base ? 1 : 1),
          totalCost: parseFloat(offer.price.total),
          currency: offer.price.currency,
          amenities: hotel.amenities || ['WiFi', 'Pool', 'Restaurant'],
          checkIn: offer.checkInDate,
          checkOut: offer.checkOutDate,
          rooms: offer.room?.typeEstimated?.beds || 1,
          guests: offer.guests.adults,
          cancellationPolicy: offer.policies?.cancellation?.description?.text || 'Standard',
          apiSource: 'amadeus',
        };
      });
    }

    return getFallbackHotels({ cityCode, adults });
  } catch (error) {
    console.log(`⚠️ Hotel API error: ${error.message}`);
    return getFallbackHotels({ cityCode, adults });
  }
};

/**
 * Get fallback hotel data when API unavailable
 */
const getFallbackHotels = ({ cityCode, adults }) => {
  const basePrice = 1500; // Base price per night

  return [
    {
      name: `Budget Hotel ${cityCode}`,
      type: 'hotel',
      location: { city: cityCode },
      rating: 3,
      pricePerNight: basePrice,
      totalCost: basePrice,
      amenities: ['WiFi', 'AC', 'TV'],
      apiSource: 'fallback',
    },
    {
      name: `Comfort Inn ${cityCode}`,
      type: 'hotel',
      location: { city: cityCode },
      rating: 4,
      pricePerNight: basePrice * 1.5,
      totalCost: basePrice * 1.5,
      amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym'],
      apiSource: 'fallback',
    },
  ];
};

// ==================== INDIAN RAILWAY API ====================

/**
 * Search for trains between two stations
 * @param {object} params - {source, destination, date}
 * @returns {Promise<Array>} Train options
 */
const searchTrains = async ({ source, destination, date }) => {
  try {
    console.log(`🚂 Searching trains from ${source} to ${destination}...`);

    // ========== PRIORITY 1: Use actual trainService (erail.in) ==========
    try {
      let trainData;
      
      if (date) {
        trainData = await trainService.getTrainsOnDate(source, destination, date);
      } else {
        trainData = await trainService.getTrainsBetweenStations(source, destination);
      }

      if (trainData.success && trainData.data && trainData.data.length > 0) {
        console.log(`✅ Found ${trainData.data.length} trains via trainService (erail.in)`);
        
        // Use distance calculation (includes custom distances for major routes)
        let distanceKm = calculateDistance(source, destination);
        
        console.log(`📏 Estimated distance: ${distanceKm}km`);
        const baseTrainPrice = Math.round(distanceKm * 0.8); // ₹0.80 per km for sleeper class
        console.log(`💰 Base train price (sleeper): ₹${baseTrainPrice}`);
        
        // Transform trainService data to match external API format
        return trainData.data.slice(0, 10).map((train) => {
          const trainType = train.train_base?.train_name || train.train_name || '';
          const trainClass = train.train_base?.type || 'SL';
          
          // Adjust price based on train type (express, rajdhani, etc.)
          let priceMultiplier = 1.0;
          if (trainType.includes('RAJDHANI')) priceMultiplier = 2.0;
          else if (trainType.includes('SHATABDI')) priceMultiplier = 1.5;
          else if (trainType.includes('EXPRESS')) priceMultiplier = 1.1;
          else if (trainType.includes('LOCAL') || trainType.includes('PASSENGER')) priceMultiplier = 0.7;
          
          const trainPrice = Math.round(baseTrainPrice * priceMultiplier);
          
          console.log(`🚂 ${trainType.substring(0, 30)} -> ₹${trainPrice} (multiplier: ${priceMultiplier}x)`);
          
          return {
            source: source,
            destination: destination,
            mode: 'train',
            provider: 'Indian Railways',
            trainNumber: train.train_base?.train_no || train.train_no,
            trainName: train.train_base?.train_name || train.train_name,
            class: trainClass,
            departure: {
              time: train.train_base?.from_time || train.from_time,
              station: source,
            },
            arrival: {
              time: train.train_base?.to_time || train.to_time,
              station: destination,
            },
            duration: train.train_base?.travel_time || train.duration,
            price: trainPrice,
            totalCost: trainPrice,
            availableClasses: ['3A', 'SL', '2A', '1A'],
            amenities: ['Toilet', 'Pantry Car'],
            apiSource: 'indian_railway',
          };
        });
      }
    } catch (trainServiceError) {
      console.log(`⚠️ trainService error: ${trainServiceError.message}`);
    }

    // ========== PRIORITY 2: Try external RapidAPI (fallback) ==========
    try {
      const apiKey = process.env.INDIAN_RAIL_API_KEY;

      if (apiKey) {
        const sourceCode = getStationCode(source);
        const destCode = getStationCode(destination);

        const response = await axios.get(
          'https://indian-railway-api.p.rapidapi.com/trains/getBetweenStations',
          {
            params: {
              from: sourceCode,
              to: destCode,
              date: date || getDefaultDepartureDate(),
            },
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'indian-railway-api.p.rapidapi.com',
            },
            timeout: 10000,
          }
        );

        if (response.data && response.data.data && response.data.data.length > 0) {
          console.log(`✅ Found ${response.data.data.length} trains via RapidAPI`);

          return response.data.data.map((train) => ({
            source: source,
            destination: destination,
            mode: 'train',
            provider: 'Indian Railways',
            trainNumber: train.train_no,
            trainName: train.train_name,
            class: train.class || 'SL',
            departure: {
              time: train.from_time,
              station: source,
            },
            arrival: {
              time: train.to_time,
              station: destination,
            },
            duration: train.duration,
            price: train.price || 500,
            totalCost: train.price || 500,
            availableClasses: ['3A', 'SL', '2A', '1A'],
            amenities: ['Charging Point', 'Pantry Car'],
            apiSource: 'indian_railway',
          }));
        }
      }
    } catch (rapidApiError) {
      console.log(`⚠️ RapidAPI error: ${rapidApiError.message}`);
    }

    // ========== FALLBACK: Use estimated data ==========
    console.log(`⚠️ No API data available, using fallback estimates`);
    return getFallbackTrains({ source, destination });

  } catch (error) {
    console.log(`❌ Train search error: ${error.message}`);
    return getFallbackTrains({ source, destination });
  }
};

/**
 * Get fallback train data
 */
const getFallbackTrains = ({ source, destination }) => {
  const distance = calculateDistance(source, destination);
  const basePrice = Math.round(distance * 0.50); // ₹0.50 per km
  const duration = Math.round(distance / 60); // Assume 60 km/h average

  console.log(`📊 Using fallback train estimates (distance: ${distance}km, duration: ${duration}h)`);

  return [
    {
      source: source,
      destination: destination,
      mode: 'train',
      provider: 'Indian Railways',
      trainNumber: '12001',
      trainName: 'Rajdhani Express',
      class: '2A',
      duration: `${Math.round(duration * 0.75)}h`, // Faster
      price: basePrice * 2.5,
      totalCost: basePrice * 2.5,
      availableClasses: ['1A', '2A', 'FC'],
      apiSource: 'fallback',
    },
    {
      source: source,
      destination: destination,
      mode: 'train',
      provider: 'Indian Railways',
      trainNumber: '12345',
      trainName: 'Superfast Express',
      class: '3A',
      duration: `${Math.round(duration * 0.85)}h`,
      price: basePrice * 1.5,
      totalCost: basePrice * 1.5,
      availableClasses: ['3A', 'SL', '2A'],
      apiSource: 'fallback',
    },
    {
      source: source,
      destination: destination,
      mode: 'train',
      provider: 'Indian Railways',
      trainNumber: '12346',
      trainName: 'Mail Express',
      class: 'SL',
      duration: `${duration}h`,
      price: basePrice,
      totalCost: basePrice,
      availableClasses: ['3A', 'SL'],
      apiSource: 'fallback',
    },
    {
      source: source,
      destination: destination,
      mode: 'train',
      provider: 'Indian Railways',
      trainNumber: '12347',
      trainName: 'Passenger Train',
      class: 'UR',
      duration: `${Math.round(duration * 1.2)}h`, // Slower, stops more
      price: Math.round(basePrice * 0.3),
      totalCost: Math.round(basePrice * 0.3),
      availableClasses: ['UR', 'SL'],
      apiSource: 'fallback',
    },
  ];
};

// ==================== UNSPLASH API (Destination Photos) ====================

/**
 * Get destination photos from Unsplash
 * @param {string} destination - Destination city
 * @returns {Promise<Array>} List of photo URLs
 */
const getDestinationPhotos = async (destination) => {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      console.log('⚠️ Unsplash API key not configured');
      return [];
    }

    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: `${destination} India travel`,
        per_page: 10,
        orientation: 'landscape',
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
      timeout: 5000,
    });

    if (response.data.results && response.data.results.length > 0) {
      console.log(`✅ Found ${response.data.results.length} photos for ${destination}`);
      return response.data.results.map((photo) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        alt: photo.alt_description || destination,
        credit: photo.user.name,
        creditLink: photo.user.links.html,
        apiSource: 'unsplash',
      }));
    }

    return [];
  } catch (error) {
    console.log(`⚠️ Unsplash API error: ${error.message}`);
    return [];
  }
};

/**
 * Get attractions with Unsplash photos
 * @param {string} destination - Destination city
 * @returns {Promise<Array>} List of attractions
 */
const getAttractions = async (destination) => {
  const [attractions, photos] = await Promise.all([
    Promise.resolve(getFallbackAttractions(destination)),
    getDestinationPhotos(destination),
  ]);

  // Attach photos to attractions where available
  return attractions.map((attraction, index) => ({
    ...attraction,
    photo: photos[index] || null,
  }));
};

/**
 * Fallback attractions data
 */
const getFallbackAttractions = (destination) => {
  return [];
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse ISO 8601 duration (PT2H30M) to human-readable (2h 30m)
 */
const parseDuration = (iso) => {
  if (!iso) return 'N/A';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : '';
  const m = match[2] ? ` ${match[2]}m` : '';
  return (h + m).trim() || iso;
};

/**
 * Get IATA code for major Indian cities
 */
const getCityIATACode = (city) => {
  const codes = {
    delhi: 'DEL',
    'new delhi': 'DEL',
    mumbai: 'BOM',
    bombay: 'BOM',
    bangalore: 'BLR',
    bengaluru: 'BLR',
    kolkata: 'CCU',
    calcutta: 'CCU',
    chennai: 'MAA',
    madras: 'MAA',
    hyderabad: 'HYD',
    pune: 'PNQ',
    ahmedabad: 'AMD',
    jaipur: 'JAI',
    goa: 'GOI',
    panaji: 'GOI',
    kochi: 'COK',
    cochin: 'COK',
    thiruvananthapuram: 'TRV',
    trivandrum: 'TRV',
    lucknow: 'LKO',
    chandigarh: 'IXC',
    srinagar: 'SXR',
    amritsar: 'ATQ',
    nagpur: 'NAG',
    bhopal: 'BHO',
    indore: 'IDR',
    varanasi: 'VNS',
    patna: 'PAT',
    ranchi: 'IXR',
    bhubaneswar: 'BBI',
    guwahati: 'GAU',
    coimbatore: 'CJB',
    madurai: 'IXM',
    visakhapatnam: 'VTZ',
    vizag: 'VTZ',
    mangalore: 'IXE',
    tiruchirappalli: 'TRZ',
    trichy: 'TRZ',
    udaipur: 'UDR',
    jodhpur: 'JDH',
    leh: 'IXL',
    dehradun: 'DED',
    shimla: 'SLV',
    agra: 'AGR',
    raipur: 'RPR',
    jammu: 'IXJ',
  };

  return codes[city.toLowerCase()] || null;
};

/**
 * Get station code for major Indian railway stations
 */
const getStationCode = (city) => {
  const codes = {
    delhi: 'NDLS',
    mumbai: 'CSTM',
    bangalore: 'SBC',
    bengaluru: 'SBC',
    kolkata: 'KOAA',
    chennai: 'MAS',
    hyderabad: 'HYB',
    pune: 'PUNE',
    jaipur: 'JP',
    ahmedabad: 'ADI',
  };

  return codes[city.toLowerCase()] || 'NDLS';
};

/**
 * Get airline name from carrier code
 */
const getAirlineName = (code) => {
  const airlines = {
    '6E': 'IndiGo',
    AI: 'Air India',
    SG: 'SpiceJet',
    UK: 'Vistara',
    G8: 'Go First',
  };

  return airlines[code] || code;
};

/**
 * Custom distances for specific routes (Punjab/Hindi belt cities)
 */
const customDistances = {
  'delhi-patna': 900,
  'patna-delhi': 900,
  'phagwara-haridwar': 240,
  'haridwar-phagwara': 240,
  'phagwara-delhi': 270,
  'delhi-phagwara': 270,
  'phagwara-patna': 550,
  'patna-phagwara': 550,
  'phagwara-jalandhar': 65,
  'jalandhar-phagwara': 65,
  'phagwara-ludhiana': 60,
  'ludhiana-phagwara': 60,
};

/**
 * Calculate approximate distance between cities (km)
 */
const calculateDistance = (city1, city2) => {
  // Simplified distance calculation (actual implementation would use coordinates)
  const distances = {
    'delhi-mumbai': 1400,
    'delhi-bangalore': 2100,
    'mumbai-bangalore': 980,
    'delhi-kolkata': 1500,
    'mumbai-goa': 580,
  };

  const key = `${city1.toLowerCase()}-${city2.toLowerCase()}`;
  const reverseKey = `${city2.toLowerCase()}-${city1.toLowerCase()}`;

  // Check custom distances first
  if (customDistances[key]) return customDistances[key];
  if (customDistances[reverseKey]) return customDistances[reverseKey];

  return distances[key] || distances[reverseKey] || 1000; // Default 1000km
};

/**
 * Calculate price based on distance
 */
const calculateDistanceBasedPrice = (source, destination, mode) => {
  const distance = calculateDistance(source, destination);

  const pricePerKm = {
    flight: 4,
    train: 0.50,
    bus: 0.75,
  };

  return Math.round(distance * pricePerKm[mode]);
};

/**
 * Get default dates if not provided
 */
const getDefaultDepartureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7); // 7 days from now
  return date.toISOString().split('T')[0];
};

const getDefaultCheckInDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

const getDefaultCheckOutDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 9); // 2 nights
  return date.toISOString().split('T')[0];
};

// ==================== EXPORTS ====================

module.exports = {
  searchFlights,
  searchHotels,
  searchTrains,
  getAttractions,
  getCityIATACode,
  getStationCode,
};
