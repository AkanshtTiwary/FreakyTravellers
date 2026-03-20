# 🚂 Railway & Train Features Implementation Guide

## Overview

This guide explains the complete railway and train fetching features implemented in the TravelBudget project.

## What's Implemented

### 1. **Train Data Fetching**
   - Real-time access to Indian Railway schedules
   - Trains between any two stations
   - Train information and routes
   - Date-specific train schedules

### 2. **Smart Filtering & Sorting**
   - Filter by date, time, and duration
   - Sort by departure time, travel duration
   - Early morning, evening, and midnight trains
   - Budget-friendly and fastest options

### 3. **Budget Optimization**
   - Estimate train fares by class
   - Integration with travel budget allocation
   - Smart recommendations based on preferences

### 4. **Comprehensive API**
   - 10+ endpoints for train operations
   - Support for 60+ major Indian cities
   - Advanced search with multiple filters
   - Station code lookup

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│         Frontend (Next.js)                       │
│  - Travel Planner Component                     │
│  - Train Search Interface                       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│      Backend Server (Express.js)                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Routes:                                        │
│  ├─ /api/trains/between          (GET)         │
│  ├─ /api/trains/on-date          (GET)         │
│  ├─ /api/trains/info             (GET)         │
│  ├─ /api/trains/route            (GET)         │
│  ├─ /api/trains/cheapest         (GET)         │
│  ├─ /api/trains/fastest          (GET)         │
│  ├─ /api/trains/early-morning    (GET)         │
│  ├─ /api/trains/evening          (GET)         │
│  ├─ /api/trains/search           (GET)         │
│  └─ /api/trains/stations         (GET)         │
│                                                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│     Train Service Layer (trainService.js)      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│   Rail Utilities (railPrettify.js)              │
│   - HTML parsing                                │
│   - Data formatting                             │
│   - Date calculations                           │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│    External Data Source (erail.in)              │
│    - Real-time train schedules                  │
│    - Route information                          │
│    - Station data                               │
└─────────────────────────────────────────────────┘
```

---

## File Structure

```
server/
├── controllers/
│   ├── trainController.js          ← Train API handlers
│   └── travelController.js         ← Travel optimization (updated)
│
├── services/
│   ├── trainService.js             ← Core train operations
│   ├── enhancedTravelPlan.service.js ← Travel with train data
│   └── indianRailService.js        ← Legacy (kept for reference)
│
├── routes/
│   └── trainRoutes.js              ← Train API endpoints
│
├── utils/
│   └── railPrettify.js             ← HTML parsing & formatting
│
└── server.js                        ← Updated main server

client/
└── Coming soon: Train search UI
```

---

## Key Files Created

### 1. `railPrettify.js` - HTML Parser
Parses HTML responses from erail.in and converts them to JSON format.

**Key Methods:**
- `betweenStation()` - Parse trains between stations
- `checkTrain()` - Parse single train info
- `getRoute()` - Parse train route
- `getDayOnDate()` - Calculate day of week
- `liveStation()` - Parse live station data
- `pnrStatus()` - Parse PNR information

### 2. `trainService.js` - Core Service
Main service layer for train operations with extended station codes and smart filtering.

**Key Functions:**
- `getTrainsBetweenStations(from, to)` - Fetch all trains
- `getTrainsOnDate(from, to, date)` - Date-specific search
- `getTrainInfo(trainNumber)` - Detailed train info
- `getTrainRoute(trainNumber)` - Complete route
- `sortTrainsByTime(trains, order)` - Sort by duration
- `sortTrainsByDeparture(trains, order)` - Sort by time
- `filterTrainsByClass(trains, class)` - Filter by train class
- Extended `STATION_CODES` mapping (60+ cities)

### 3. `trainController.js` - API Handlers
Handles all HTTP requests and response formatting.

**10 Endpoints:**
1. Between Stations
2. On Date
3. Train Info
4. Train Route
5. Cheapest Trains
6. Fastest Trains
7. Early Morning
8. Evening
9. Advanced Search
10. Station List

### 4. `trainRoutes.js` - Route Definitions
Express routes mapping to controller functions.

### 5. `enhancedTravelPlan.service.js` - AI Integration
Integration point for travel optimization with real train data.

---

## Supported Stations

**60+ cities** across India:

### North India (18 cities)
Delhi, Agra, Jaipur, Chandigarh, Amritsar, Lucknow, Varanasi, Allahabad, Kanpur, Dehradun, Haridwar, Roorkee, Saharanpur, Meerut, Ghaziabad, etc.

### West India (14 cities)
Mumbai (3 stations), Pune, Nashik, Surat, Ahmedabad, Vadodara, Rajkot, Bhavnagar, etc.

### South India (15 cities)
Bangalore, Hyderabad, Secunderabad, Chennai, Kochi, Trivandrum, Coimbatore, Salem, Kurnool, etc.

### East India (8 cities)
Kolkata, Howrah, Patna, Gaya, Ranchi, Bhubaneswar, Visakhapatnam, Sambalpur

### Central India (5 cities)
Indore, Jabalpur, Bhopal, Gwalior, Ujjain

---

## API Usage Examples

### Example 1: Get Trains Between Delhi and Mumbai

```bash
curl "http://localhost:5000/api/trains/between?from=Delhi&to=Mumbai"
```

**Response:**
```json
{
  "success": true,
  "message": "Found 12 trains from Delhi to Mumbai",
  "data": [
    {
      "train_base": {
        "train_no": "12002",
        "train_name": "SHATABDI EXPRESS",
        "from_stn_code": "NDLS",
        "to_stn_code": "LTT",
        "from_time": "16:00",
        "to_time": "06:15+1",
        "travel_time": "14h 15m"
      }
    }
  ]
}
```

### Example 2: Get Trains on Specific Date

```bash
curl "http://localhost:5000/api/trains/on-date?from=Delhi&to=Mumbai&date=22-03-2026"
```

### Example 3: Get Fastest Trains

```bash
curl "http://localhost:5000/api/trains/fastest?from=Delhi&to=Mumbai"
```

### Example 4: Advanced Search with Sorting

```bash
curl "http://localhost:5000/api/trains/search?from=Delhi&to=Mumbai&sort=duration"
```

### Example 5: Early Morning Trains

```bash
curl "http://localhost:5000/api/trains/early-morning?from=Delhi&to=Mumbai&date=22-03-2026"
```

---

## Integration with Travel Optimization

### Current Workflow

1. **User Input**: Source, Destination, Budget, Dates
2. **Travel API Call**: `/api/travel/optimize`
3. **Train Search**: Service calls trainService
4. **Smart Selection**: Filters within budget (40% allocated)
5. **Recommendation**: Returns best option with alternatives

### Example: Travel Optimization with Trains

```javascript
// Pseudocode - how it works internally
const params = {
  from: "Delhi",
  to: "Mumbai",
  budget: 5000,
  date: "22-03-2026"
};

// Get best trains for budget
const trains = await enhancedTravelPlan.getBestTrainsForBudget(
  params.from,
  params.to,
  params.date
);

// Filter within 40% budget (₹2000)
const affordable = trains.filter(t => t.estimated_cost <= 2000);

// Select best option
const selected = affordable[0];
```

---

## Train Classes and Estimated Fares

| Class | Code | Est. Fare (per 500km) |
|-------|------|---------------------|
| First AC | 1A | ₹3000 |
| Second AC | 2A | ₹1500 |
| Third AC | 3A | ₹800 |
| Sleeper | SL | ₹400 |
| General | UR | ₹150 |

**Note:** These are estimates. Actual fares vary based on distance, season, and demand.

---

## Error Handling

### Station Not Found
```json
{
  "success": false,
  "message": "Invalid stations. From: XYZ (null), To: ABC (null)"
}
```

### No Trains Available
```json
{
  "success": false,
  "message": "No direct trains found"
}
```

### Missing Required Parameters
```json
{
  "success": false,
  "message": "Please provide both from and to cities"
}
```

---

## Performance Optimizations

1. **Caching**: Consider implementing Redis for frequent routes
2. **Rate Limiting**: 100 requests per 15 minutes per IP
3. **Parallel Processing**: Multiple searches can run simultaneously
4. **Lazy Parsing**: Only parse required data

---

## Future Enhancements

1. **Real-time Pricing**: IRCTC API integration
2. **Seat Availability**: Check bed/seat availability
3. **Direct Booking**: One-click IRCTC booking
4. **User Preferences**: Save favorite trains
5. **Notifications**: Alert when train is available
6. **Dynamic Pricing**: Price trend analysis
7. **Multi-leg Journeys**: Connecting trains
8. **Cargo/Freight**: Goods transport

---

## Testing the Implementation

### 1. Start the Server

```bash
cd server
npm run dev
```

### 2. Test Basic Endpoint

```bash
curl http://localhost:5000/api/trains/stations
```

### 3. Test Train Search

```bash
curl "http://localhost:5000/api/trains/between?from=Delhi&to=Mumbai"
```

### 4. Check Server Logs

Look for:
- `🚂 Fetching trains: Delhi → Mumbai`
- `💰 Finding cheapest trains`
- `⚡ Finding fastest trains`

---

## Data Source

**Data Provider**: erail.in
- Public railway schedule database
- Updated regularly
- No authentication required
- For demonstration/personal use

**Note**: Always check IRCTC (www.irctc.co.in) for:
- Live fares
- Current availability
- Official bookings

---

## Support & Troubleshooting

### Issue: "No trains found" when trains should exist

**Solution**: 
- Verify city names are correct
- Check station code in `/api/trains/stations`
- Try with standard city names

### Issue: Slow response times

**Solution**:
- Cache frequently used routes
- Use date filters to narrow search
- Implement connection pooling

### Issue: Station not recognized

**Solution**:
- Check available stations: `/api/trains/stations`
- Add new station codes to `STATION_CODES`
- Use standard city names

---

## Deployment Notes

1. **Environment Variables**: No additional env vars needed
2. **Dependencies**: cheerio, user-agents (already added)
3. **Rate Limiting**: Adjust in production as needed
4. **CORS**: Train endpoints inherit server CORS settings

---

## Files Modified/Created

**Created:**
- ✅ `server/services/trainService.js` - Core train service
- ✅ `server/controllers/trainController.js` - Train API handlers
- ✅ `server/routes/trainRoutes.js` - Train routes
- ✅ `server/utils/railPrettify.js` - HTML parser
- ✅ `server/services/enhancedTravelPlan.service.js` - Travel integration

**Modified:**
- ✅ `server/server.js` - Added train routes
- ✅ `server/package.json` - Added dependencies

**Documentation:**
- ✅ `TRAIN_API_DOCUMENTATION.md` - API reference
- ✅ `RAILWAY_IMPLEMENTATION_GUIDE.md` - This file

---

## Quick Start

```bash
# 1. Install dependencies
cd server && npm install

# 2. Start server
npm run dev

# 3. Test endpoint
curl http://localhost:5000/api/trains/between?from=Delhi&to=Mumbai

# 4. Check response
# Should see list of trains with details
```

---

## License & Credits

- **Railway Data Source**: erail.in (public database)
- **Implementation**: FreakyTravellers team
- **External Repo**: github.com/AniCrad/indian-rail-api

---

**Last Updated**: March 20, 2026
**Version**: 1.0.0
