# 🚂 Train API Documentation

## Overview

The Train API provides comprehensive access to Indian Railway data, enabling users to search, filter, and optimize train travel options within their budget.

## Base URL

```
POST /api/trains
```

## Features

✅ Real-time train search between any two Indian cities
✅ Filter trains by date, time, and duration
✅ Smart sorting (cheapest, fastest, early morning, evening)
✅ Complete train route information
✅ Station code lookup
✅ Budget-optimized recommendations

---

## Endpoints

### 1. Get Trains Between Stations

**Endpoint:** `GET /api/trains/between`

**Description:** Fetch all trains running between two stations

**Query Parameters:**
- `from` (required): Source city name
- `to` (required): Destination city name

**Example:**
```
GET /api/trains/between?from=Delhi&to=Mumbai
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
        "from_stn_name": "New Delhi",
        "from_stn_code": "NDLS",
        "to_stn_name": "Mumbai Central",
        "to_stn_code": "BCT",
        "from_time": "16:00",
        "to_time": "06:15+1",
        "travel_time": "14h 15m",
        "running_days": "1111111"
      }
    }
  ],
  "from_city": "Delhi",
  "to_city": "Mumbai",
  "from_code": "NDLS",
  "to_code": "LTT"
}
```

---

### 2. Get Trains on Specific Date

**Endpoint:** `GET /api/trains/on-date`

**Description:** Fetch trains running on a specific date

**Query Parameters:**
- `from` (required): Source city
- `to` (required): Destination city
- `date` (required): Date in DD-MM-YYYY format

**Example:**
```
GET /api/trains/on-date?from=Delhi&to=Mumbai&date=22-03-2026
```

**Response:**
```json
{
  "success": true,
  "message": "Found 8 trains running on 22-03-2026",
  "data": [...],
  "date": "22-03-2026",
  "day_of_week": 5,
  "from_city": "Delhi"
}
```

---

### 3. Get Train Information

**Endpoint:** `GET /api/trains/info`

**Description:** Get detailed information about a specific train

**Query Parameters:**
- `trainNo` (required): Train number

**Example:**
```
GET /api/trains/info?trainNo=12002
```

**Response:**
```json
{
  "success": true,
  "data": {
    "train_no": "12002",
    "train_name": "SHATABDI EXPRESS",
    "from_stn_name": "New Delhi",
    "to_stn_name": "Mumbai Central",
    "from_time": "16:00",
    "to_time": "06:15",
    "travel_time": "14h 15m",
    "type": "AC",
    "distance": "1338 km"
  }
}
```

---

### 4. Get Train Route

**Endpoint:** `GET /api/trains/route`

**Description:** Get complete route with all stops

**Query Parameters:**
- `trainNo` (required): Train number

**Example:**
```
GET /api/trains/route?trainNo=12002
```

**Response:**
```json
{
  "success": true,
  "message": "Train 12002 (SHATABDI EXPRESS) has 5 stops",
  "data": [
    {
      "source_stn_name": "New Delhi",
      "source_stn_code": "NDLS",
      "arrive": "16:00",
      "depart": "16:00",
      "distance": "0 km",
      "zone": "CR"
    },
    {
      "source_stn_name": "Jhansi Junction",
      "source_stn_code": "JHS",
      "arrive": "20:33",
      "depart": "20:38",
      "distance": "390 km",
      "zone": "CR"
    }
  ],
  "train_number": "12002",
  "train_name": "SHATABDI EXPRESS"
}
```

---

### 5. Get Cheapest Trains

**Endpoint:** `GET /api/trains/cheapest`

**Description:** Get trains sorted by duration (cheaper routes usually longer)

**Query Parameters:**
- `from` (required): Source city
- `to` (required): Destination city
- `date` (optional): Travel date in DD-MM-YYYY format

**Example:**
```
GET /api/trains/cheapest?from=Delhi&to=Mumbai&date=22-03-2026
```

---

### 6. Get Fastest Trains

**Endpoint:** `GET /api/trains/fastest`

**Description:** Get trains with shortest travel duration

**Query Parameters:**
- `from` (required): Source city
- `to` (required): Destination city
- `date` (optional): Travel date

**Example:**
```
GET /api/trains/fastest?from=Delhi&to=Mumbai
```

---

### 7. Get Early Morning Trains

**Endpoint:** `GET /api/trains/early-morning`

**Description:** Get trains departing between 5 AM and 12 PM

**Query Parameters:**
- `from` (required): Source city
- `to` (required): Destination city
- `date` (required): Travel date in DD-MM-YYYY format

**Example:**
```
GET /api/trains/early-morning?from=Delhi&to=Mumbai&date=22-03-2026
```

**Response:**
```json
{
  "success": true,
  "message": "Found 4 early morning trains",
  "data": [...],
  "time_range": "05:00 - 12:00",
  "from_city": "Delhi"
}
```

---

### 8. Get Evening Trains

**Endpoint:** `GET /api/trains/evening`

**Description:** Get trains departing between 4 PM and 11:59 PM

**Query Parameters:**
- `from` (required): Source city
- `to` (required): Destination city
- `date` (required): Travel date in DD-MM-YYYY format

**Example:**
```
GET /api/trains/evening?from=Delhi&to=Mumbai&date=22-03-2026
```

---

### 9. Advanced Train Search

**Endpoint:** `GET /api/trains/search`

**Description:** Search trains with custom sorting options

**Query Parameters:**
- `from` (required): Source city
- `to` (required): Destination city
- `date` (optional): Travel date
- `sort` (optional): Sort by - `departure`, `arrival`, `duration` (default: `departure`)

**Example:**
```
GET /api/trains/search?from=Delhi&to=Mumbai&date=22-03-2026&sort=duration
```

---

### 10. Get Available Stations

**Endpoint:** `GET /api/trains/stations`

**Description:** Get list of all supported stations with codes

**Example:**
```
GET /api/trains/stations
```

**Response:**
```json
{
  "success": true,
  "message": "Available 200 stations",
  "data": [
    { "city": "agra", "code": "AGC" },
    { "city": "ahmedabad", "code": "ADI" },
    { "city": "amritsar", "code": "ASR" },
    ...
  ]
}
```

---

## Supported Cities

The API supports 60+ major Indian cities:

**North India:** Delhi, Agra, Jaipur, Chandigarh, Amritsar, Lucknow, Varanasi, Kanpur, Dehradun, Haridwar

**West India:** Mumbai, Pune, Ahmedabad, Vadodara, Surat, Rajkot, Nashik

**South India:** Bangalore, Hyderabad, Chennai, Kochi, Trivandrum, Coimbatore, Salem

**East India:** Kolkata, Howrah, Patna, Ranchi, Bhubaneswar

**Central India:** Indore, Jabalpur, Bhopal, Gwalior

---

## Train Classes

- **1A** - First AC
- **2A** - Second AC (3-tier)
- **3A** - Third AC (3-tier)
- **SL** - Sleeper
- **UR** - General/Unreserved

---

## Date Format

All dates should be in **DD-MM-YYYY** format:
- Example: `22-03-2026` for March 22, 2026

---

## Running Days Format

Running days are encoded as 7-digit strings (Sunday to Saturday):
- `1` = Train runs on that day
- `0` = Train does not run on that day
- Example: `1111111` = Runs daily

---

## Error Handling

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Please provide both from and to cities"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "No direct trains found"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Error: [error details]"
}
```

---

## Rate Limiting

API calls are rate-limited to **100 requests per 15 minutes** per IP address.

---

## Best Practices

1. **Cache Responses**: Train schedules don't change frequently. Cache responses for better performance.
2. **Use Specific Dates**: Provide dates for accurate results as train schedules vary.
3. **Combine Filters**: Use search endpoint with sort parameter for better results.
4. **Check for Alternatives**: Always provide best 3-5 options to users.

---

## Integration with Travel Optimization

The Train API is integrated with the travel optimization engine:

```javascript
// Get optimized travel plan with real train data
POST /api/travel/optimize-with-trains
Body: {
  "from": "Delhi",
  "to": "Mumbai",
  "budget": 5000,
  "date": "22-03-2026",
  "preference": "budget" // or "speed"
}
```

---

## Sample Use Case

### Budget Travel from Delhi to Goa

```bash
# 1. Get all trains
curl "http://localhost:5000/api/trains/between?from=Delhi&to=Goa"

# 2. Filter by date
curl "http://localhost:5000/api/trains/on-date?from=Delhi&to=Goa&date=25-03-2026"

# 3. Get cheapest options
curl "http://localhost:5000/api/trains/cheapest?from=Delhi&to=Goa&date=25-03-2026"

# 4. Get route details
curl "http://localhost:5000/api/trains/route?trainNo=12345"
```

---

## Notes

- Prices shown are estimates. Actual fares may vary.
- For live pricing and booking, use IRCTC website.
- Data is fetched from erail.in public API.
- Real-time bed availability not included (check IRCTC directly).

---

## Support

For issues or feature requests, contact the development team.
