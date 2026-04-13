/**
 * Indian Cities & States Validator
 * Comprehensive list of supported Indian destinations
 */

const INDIAN_CITIES = [
  // Major Cities
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Bhopal', 'Visakhapatnam',
  'Surat', 'Nagpur', 'Ghaziabad', 'Ludhiana', 'Kochi', 'Mathura', 'Agra',
  'Varanasi', 'Goa', 'Udaipur', 'Jodhpur', 'Shimla', 'Manali', 'Darjeeling',
  'Leh', 'Srinagar', 'Amritsar', 'Jaisalmer', 'Pushkar', 'Mysore', 'Coorg',
  'Ooty', 'Kodaikanal', 'Munnar', 'Alleppey', 'Kottayam', 'Thrissur', 'Pondicherry',
  'Mahabalipuram', 'Tirupati', 'Hampi', 'Belgaum', 'Gokarna', 'Ramanagaram',
  'Rishikesh', 'Haridwar', 'Nainital', 'Ranikhet', 'Munsiyari', 'Auli',
  'Kedarnath', 'Badrinath', 'Khimsar', 'Bikaner', 'Ajmer', 'Mount Abu',
  'Chitrakoot', 'Jabalpur', 'Kanyakumari', 'Thiruvananthapuram', 'Ernakulam',
  'Indore', 'Mandu', 'Ujjain', 'Omkareshwar', 'Maheshwar', 'Dhulia',
  'Aurangabad', 'Lonavala', 'Mahabaleshwar', 'Satara', 'Kolhapur', 'Raigad',
  'Nashik', 'Shirdi', 'Solapur', 'Belgaum', 'Bijapur', 'Gulbarga',
  'Kalyani', 'Ahmednagar', 'Nashik', 'Latur', 'Nanded', 'Yavatmal',
  'Bathinda', 'Amritsar', 'Jalandhar', 'Pathankot', 'Ferozepore', 'Gurdaspur',
  'Moga', 'Ferozepur', 'Muktsar', 'Malerkotla', 'Fatehgarh Sahib', 'Roopnagar',
  'Sangrur', 'Faridkot', 'Fazilka', 'Abohar', 'Bathinda', 'Mansa',
  
  // Indian States (full names)
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Ladakh', 'Jammu and Kashmir', 'Delhi', 'Puducherry', 'Daman and Diu',
  'Dadra and Nagar Haveli', 'Andaman and Nicobar Islands', 'Lakshadweep',
  'Chandigarh',
];

/**
 * Countries and International Cities that are NOT supported
 */
const INTERNATIONAL_COUNTRIES = [
  // Countries
  'USA', 'United States', 'America', 'UK', 'United Kingdom', 'England', 'Canada', 'Australia', 'France', 'Germany',
  'Spain', 'Italy', 'Japan', 'China', 'Thailand', 'Vietnam', 'Singapore', 'Indonesia',
  'Malaysia', 'Philippines', 'Sri Lanka', 'Pakistan', 'Bangladesh',
  'Nepal', 'Bhutan', 'Myanmar', 'Dubai', 'UAE', 'Qatar', 'Saudi Arabia',
  'Egypt', 'Greece', 'Turkey', 'Netherlands', 'Belgium', 'Switzerland',
  'Austria', 'Poland', 'Portugal', 'Mexico', 'Brazil', 'Argentina',
  'New Zealand', 'South Korea', 'Hong Kong', 'Maldives', 'Mauritius', 'Seychelles',
  'Kenya', 'South Africa', 'Morocco', 'Dominican Republic', 'Jamaica',
  'Russia', 'Ukraine', 'Israel', 'Lebanon', 'Jordan', 'Oman', 'Ethiopia',
  
  // International Cities
  'New York', 'Los Angeles', 'London', 'Paris', 'Tokyo', 'Sydney', 'Barcelona', 'Rome',
  'Amsterdam', 'Berlin', 'Vienna', 'Prague', 'Bali', 'Bangkok', 'Phuket', 'Hong Kong',
  'Singapore', 'Kuala Lumpur', 'Istanbul', 'Cairo', 'Dubai', 'Abu Dhabi', 'Doha',
  'Seoul', 'Beijing', 'Shanghai', 'Hong Kong', 'Tokyo', 'Bangkok', 'Melbourne',
  'Auckland', 'Istanbul', 'Athens', 'Santorini', 'Mykonos', 'Ibiza', 'Cancun',
  'Punta Cana', 'Montego Bay', 'Miami', 'Las Vegas', 'Orlando', 'Vancouver',
  'Toronto', 'Mexico City', 'Sao Paulo', 'Buenos Aires', 'Rio De Janeiro',
  'Lima', 'Santiago', 'Cabo San Lucas', 'Playa Del Carmen', 'Puerto Vallarta',
  'Acapulco', 'Moscow', 'St Petersburg', 'Warsaw', 'Budapest', 'Bucharest',
  'Athens', 'Tel Aviv', 'Jerusalem', 'Beirut', 'Amman', 'Muscat', 'Cape Town',
];

/**
 * Check if a city/state is in India (STRICT MODE - only accepts known locations)
 * @param {string} location - City or state name
 * @returns {boolean}
 */
const isIndianLocation = (location) => {
  if (!location || typeof location !== 'string') return false;
  
  const normalized = location.trim().toLowerCase();
  
  // First, check if it's explicitly an international location
  const isInternational = INTERNATIONAL_COUNTRIES.some(country => 
    country.toLowerCase() === normalized ||
    normalized === country.toLowerCase()
  );
  
  if (isInternational) {
    return false;
  }
  
  // Then check against Indian cities/states (STRICT - must match exactly or be contained)
  const isInIndianCities = INDIAN_CITIES.some(city => {
    const cityLower = city.toLowerCase();
    return (
      cityLower === normalized ||                    // Exact match
      normalized === cityLower ||                    // Reverse exact match
      (normalized.length > 3 && cityLower.includes(normalized)) ||  // Partial match (min 3 chars)
      (normalized.length > 3 && normalized.includes(cityLower))     // Reverse partial
    );
  });
  
  // ONLY return true if explicitly found in Indian cities
  // NEVER accept unknown/ambiguous locations
  return isInIndianCities;
};

/**
 * Validate both source and destination are in India
 * @param {string} source - Source city/state
 * @param {string} destination - Destination city/state
 * @returns {object} - { isValid: boolean, message: string }
 */
const validateIndianDestinations = (source, destination) => {
  if (!isIndianLocation(source)) {
    return {
      isValid: false,
      message: 'Source location must be within India. We currently operate only in India.',
      type: 'international_source',
    };
  }
  
  if (!isIndianLocation(destination)) {
    return {
      isValid: false,
      message: '🇮🇳 We are currently available in India only. Please select a destination within India.',
      type: 'international_destination',
    };
  }
  
  return { isValid: true, message: 'Valid destination' };
};

module.exports = {
  INDIAN_CITIES,
  INTERNATIONAL_COUNTRIES,
  isIndianLocation,
  validateIndianDestinations,
};
