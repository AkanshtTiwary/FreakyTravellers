# 🚂 Train API System Architecture & Flow Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                             │
│                    (Next.js Frontend / Mobile App)                       │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                    HTTP Requests / REST API
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                       TRAIN API GATEWAY                                  │
│                    (Express.js Server)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TRAIN ROUTES                                                   │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  • GET /api/trains/between         QueryParams: {from, to}    │   │
│  │  • GET /api/trains/on-date         QueryParams: {from, to, date}  │
│  │  • GET /api/trains/info            QueryParams: {trainNo}      │   │
│  │  • GET /api/trains/route           QueryParams: {trainNo}      │   │
│  │  • GET /api/trains/cheapest        QueryParams: {from, to}    │   │
│  │  • GET /api/trains/fastest         QueryParams: {from, to}    │   │
│  │  • GET /api/trains/early-morning   QueryParams: {from,to,date}   │
│  │  • GET /api/trains/evening         QueryParams: {from,to,date}   │
│  │  • GET /api/trains/search          QueryParams: {from, to, sort}   │
│  │  • GET /api/trains/stations        No parameters              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                    Routed by trainRoutes.js                             │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TRAIN CONTROLLER                                               │   │
│  │  (trainController.js)                                           │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  • Validates input parameters                                   │   │
│  │  • Handles error cases                                          │   │
│  │  • Calls trainService methods                                   │   │
│  │  • Formats responses                                            │   │
│  │  • Logs operations                                              │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                    Delegates to trainService                            │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  TRAIN SERVICE                                                  │   │
│  │  (trainService.js)                                              │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  • getTrainsBetweenStations(from, to)                          │   │
│  │  • getTrainsOnDate(from, to, date)                             │   │
│  │  • getTrainInfo(trainNumber)                                   │   │
│  │  • getTrainRoute(trainNumber)                                  │   │
│  │  • sortTrainsByTime(trains, order)                             │   │
│  │  • sortTrainsByDeparture(trains, order)                        │   │
│  │  • getStationCode(cityName)                                    │   │
│  │  • STATION_CODES mapping (60+ cities)                          │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  Fetches HTML & Parses with railPrettify                               │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  HTML PARSER                                                    │   │
│  │  (railPrettify.js)                                              │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                  │   │
│  │  • betweenStation() - Parse trains between stations            │   │
│  │  • checkTrain() - Parse single train info                      │   │
│  │  • getRoute() - Parse train route                              │   │
│  │  • getDayOnDate() - Calculate day of week                      │   │
│  │  • liveStation() - Parse live station data                     │   │
│  │  • pnrStatus() - Parse PNR information                         │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│            Fetches data from external API                              │
│                                    ▼                                     │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             │  HTTP Requests
                             │  User-Agent Rotation
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                      EXTERNAL DATA SOURCE                                │
│                    (erail.in Public API)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  • Real-time train schedules                                            │
│  • Route information                                                    │
│  • Station data                                                         │
│  • Train details                                                        │
│  • Running patterns                                                     │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow (Sequence Diagram)

```
CLIENT                  TRAIN ROUTES         CONTROLLER           SERVICE
  │                         │                    │                   │
  │─ GET /api/trains/between?from=Delhi&to=Mumbai
  │──────────────────────────►│                    │                   │
  │                           │                    │                   │
  │                           │─ Receive request  │                   │
  │                           │──────────────────►│                   │
  │                           │                    │                   │
  │                           │                    │ Validate input     │
  │                           │                    │ Extract parameters │
  │                           │                    │                   │
  │                           │                    │─ Call service     │
  │                           │                    │──────────────────►│
  │                           │                    │                   │
  │                           │                    │                   │ Lookup codes
  │                           │                    │                   │ Delhi → NDLS
  │                           │                    │                   │ Mumbai → LTT
  │                           │                    │                   │
  │                           │                    │                   │ Fetch from
  │                           │                    │                   │ erail.in API
  │                           │                    │                   │
  │                           │                    │                   │ Parse HTML
  │                           │                    │                   │ using railPrettify
  │                           │                    │                   │
  │                           │                    │◄─ Return array    │
  │                           │                    │   of trains       │
  │                           │                    │                   │
  │                           │                    │ Format response   │
  │                           │                    │ Add metadata      │
  │                           │                    │                   │
  │                           │◄─ Return response │                   │
  │                           │                    │                   │
  │◄──────────────────────────┤                    │                   │
  │   JSON response            │                    │                   │
  │                           │                    │                   │
```

---

## Data Processing Pipeline

```
RAW HTML FROM ERAIL.IN
    │
    ▼
┌─────────────────────────────────────┐
│  HTML CONTENT                        │
│  - Train numbers                    │
│  - Train names                      │
│  - Station codes                    │
│  - Times                             │
│  - Duration                          │
│  - Running days                      │
└─────────────────────────────────────┘
    │
    ▼ railPrettify.js
┌─────────────────────────────────────┐
│  PARSING PHASE                      │
│                                      │
│  1. Split by delimiters (~, ~^)    │
│  2. Extract train data              │
│  3. Clean empty strings             │
│  4. Structure data                  │
│  5. Handle errors gracefully        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  PARSED DATA (JSON)                 │
│  {                                   │
│    "train_no": "12002",             │
│    "train_name": "SHATABDI",       │
│    "from_time": "16:00",           │
│    "to_time": "06:15",             │
│    "travel_time": "14h 15m",       │
│    "running_days": "1111111"       │
│  }                                   │
└─────────────────────────────────────┘
    │
    ▼ trainService.js
┌─────────────────────────────────────┐
│  FILTERING & SORTING               │
│                                      │
│  1. Filter by date (running_days)  │
│  2. Sort by time/duration          │
│  3. Group by preference             │
│  4. Limit results                   │
└─────────────────────────────────────┘
    │
    ▼ trainController.js
┌─────────────────────────────────────┐
│  RESPONSE FORMATTING               │
│                                      │
│  1. Add metadata                    │
│  2. Add timestamps                  │
│  3. Format for client               │
│  4. Include error handling          │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  FINAL JSON RESPONSE                │
│  {                                   │
│    "success": true,                │
│    "message": "Found X trains",    │
│    "data": [...],                  │
│    "timestamp": 1711000000000      │
│  }                                   │
└─────────────────────────────────────┘
    │
    ▼
CLIENT APPLICATION
```

---

## Station Code Lookup Flow

```
INPUT: "Delhi"
  │
  ▼
┌───────────────────────────────────────────┐
│  getStationCode("Delhi")                  │
├───────────────────────────────────────────┤
│  1. Convert to lowercase: "delhi"        │
│  2. Trim whitespace                       │
│  3. Look in STATION_CODES mapping        │
│  4. Return code or null                   │
└───────────────────────────────────────────┘
  │
  ├─ "Delhi" → NDLS (New Delhi)
  ├─ "delhi" → NDLS
  ├─ "new delhi" → NDLS
  ├─ "delhi cantt" → DEC
  ├─ "old delhi" → DLI
  │
  └─ "invalid" → null
```

---

## Train Search Process

```
Step 1: USER INPUT
┌──────────────────────────────────────┐
│ From: Delhi                          │
│ To: Mumbai                           │
│ Date: 22-03-2026 (Optional)         │
│ Preference: Budget / Speed           │
└──────────────────────────────────────┘
    │
    ▼
Step 2: API REQUEST
┌──────────────────────────────────────┐
│ GET /api/trains/on-date             │
│ ?from=Delhi&to=Mumbai               │
│ &date=22-03-2026                    │
└──────────────────────────────────────┘
    │
    ▼
Step 3: PARAMETER VALIDATION
┌──────────────────────────────────────┐
│ ✓ From provided                      │
│ ✓ To provided                        │
│ ✓ Date format valid                  │
│ Continue...                          │
└──────────────────────────────────────┘
    │
    ▼
Step 4: STATION CODE LOOKUP
┌──────────────────────────────────────┐
│ Delhi → NDLS                         │
│ Mumbai → LTT                         │
└──────────────────────────────────────┘
    │
    ▼
Step 5: FETCH FROM ERAIL.IN
┌──────────────────────────────────────┐
│ GET https://erail.in/rail/getTrains │
│ ?Station_From=NDLS                  │
│ &Station_To=LTT                     │
│ (with User-Agent)                    │
└──────────────────────────────────────┘
    │
    ▼
Step 6: PARSE HTML RESPONSE
┌──────────────────────────────────────┐
│ Extract train entries                │
│ Parse each field                     │
│ Convert to JSON                      │
│ Handle errors                        │
└──────────────────────────────────────┘
    │
    ▼
Step 7: FILTER BY DATE (if provided)
┌──────────────────────────────────────┐
│ Calculate day of week from date      │
│ Check running_days bitmask           │
│ Keep only trains running on that day │
└──────────────────────────────────────┘
    │
    ▼
Step 8: SORT RESULTS
┌──────────────────────────────────────┐
│ By departure time (default)          │
│ By duration (if requested)           │
│ Limit to top results                 │
└──────────────────────────────────────┘
    │
    ▼
Step 9: FORMAT RESPONSE
┌──────────────────────────────────────┐
│ Add success flag                     │
│ Add message                          │
│ Add metadata                         │
│ Add timestamp                        │
└──────────────────────────────────────┘
    │
    ▼
Step 10: RETURN TO CLIENT
┌──────────────────────────────────────┐
│ {                                    │
│   "success": true,                  │
│   "message": "Found X trains",      │
│   "data": [...],                    │
│   "from_city": "Delhi",             │
│   "to_city": "Mumbai",              │
│   "date": "22-03-2026"              │
│ }                                    │
└──────────────────────────────────────┘
```

---

## Error Handling Flow

```
API REQUEST
    │
    ▼
┌──────────────────────────┐
│ Validate parameters      │
└──────────────────────────┘
    │
    ├─ Missing required? ─────────────────┐
    │                                      ▼
    │                          Return 400: Missing parameter
    │
    ├─ Invalid format? ──────────────────┐
    │                                      ▼
    │                          Return 400: Invalid format
    │
    └─ Pass ──────────────────────────────────┐
                                               ▼
                                    Lookup station codes
                                               │
                                               ├─ Not found? ─────────────┐
                                               │                          ▼
                                               │                Return 400: Invalid station
                                               │
                                               └─ Valid ──────────────────┐
                                                                          ▼
                                                                Fetch from erail.in
                                                                          │
                                                                          ├─ Network error? ┐
                                                                          │                  ▼
                                                                          │      Return 500: Network error
                                                                          │
                                                                          ├─ No results? ─────┐
                                                                          │                    ▼
                                                                          │      Return 400: No trains found
                                                                          │
                                                                          └─ Success ────────┐
                                                                                             ▼
                                                                                   Return 200: Trains data
```

---

## Budget Optimization Flow

```
TRAVEL OPTIMIZATION REQUEST
    │
    ├─ From: Delhi
    ├─ To: Mumbai
    ├─ Budget: ₹5000
    └─ Travelers: 2
    │
    ▼
BUDGET ALLOCATION
    │
    ├─ Transport: 40% (₹2000)
    ├─ Accommodation: 40% (₹2000)
    └─ Food: 20% (₹1000)
    │
    ▼
FETCH TRAIN OPTIONS
    │
    Get all trains Delhi → Mumbai
    │
    ▼
FILTER BY BUDGET
    │
    Keep trains with fare ≤ ₹2000
    │
    ▼
SORT OPTIONS
    │
    By availability
    By speed/comfort
    │
    ▼
SELECT RECOMMENDATION
    │
    Pick best within budget
    │
    ▼
GENERATE ALTERNATIVES
    │
    Offer 2-3 backup options
    │
    ▼
RETURN PLAN
    │
    Primary choice + Alternatives
```

---

## Performance Considerations

```
OPTIMIZATION POINTS

1. CACHING
   ├─ Cache train schedules (hourly)
   ├─ Cache station codes (daily)
   └─ Cache route information (weekly)

2. BATCHING
   ├─ Combine related requests
   ├─ Parallel fetching
   └─ Optimized parsing

3. FILTERING
   ├─ Filter early (before sorting)
   ├─ Limit result size
   └─ Index common queries

4. COMPRESSION
   ├─ Gzip responses
   ├─ Minimize payload
   └─ Remove redundant data

5. MONITORING
   ├─ Track response times
   ├─ Monitor error rates
   └─ Analyze usage patterns
```

---

## Integration with Travel System

```
TRAVEL PLANNER
    │
    ├─ Get hotels
    ├─ Get restaurants
    ├─ Get trains ◄────────────┐
    │                          │
    └─ Optimize budget        │
                               │
                    NEW: Train Service
                               │
        ┌──────────────────────┴────────────┐
        │                                    │
    GET TRAINS              OPTIMIZE FARE
        │                        │
        └────────────┬───────────┘
                     │
            BUDGET-FRIENDLY
              SELECTION
                     │
            INTEGRATED PLAN
```

---

## Status Verification

```
SYSTEM VALIDATION

✅ Code Syntax       - Validated
✅ Dependencies      - Installed
✅ Routes            - Mounted
✅ Controllers       - Ready
✅ Services          - Functional
✅ Utilities         - Working
✅ Error Handling    - Implemented
✅ Documentation     - Complete
✅ Examples          - Provided
✅ Integration       - Successful

RESULT: 🟢 READY FOR PRODUCTION
```

---

**Last Updated**: March 20, 2026
**Status**: Production Ready ✅
**Version**: 1.0.0
