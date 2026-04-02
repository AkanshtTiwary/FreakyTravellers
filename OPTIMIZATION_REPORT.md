# TravelBudget Codebase - Comprehensive Optimization Report

**Generated:** April 2, 2026  
**Analysis Depth:** Full codebase scan  
**Files Analyzed:** 30+ files across controllers, services, models, middleware, utils, and routes

---

## Executive Summary

The TravelBudget codebase has significant opportunities for optimization. Analysis identified:
- **85+ debug logging statements** (console.log/error/warn)
- **4 duplicate function definitions** (formatTime, formatDuration)
- **1 critical bug** (undefined variable reference)
- **Multiple duplicate code blocks** (similar logic repeated)
- **Complex functions** exceeding 500 lines
- **Unused imports** in several files
- **Redundant helper functions**

---

## 1. DEAD CODE & DEBUG STATEMENTS

### 1.1 Excessive Console Logging

**Severity:** HIGH | **Impact:** Performance, Production Readiness  
**Count:** 87 console.log/error/warn statements

#### Critical Debug Logs (Production Readiness Risk)

**File:** [server/controllers/travelController.js](server/controllers/travelController.js#L40-L44)
```javascript
// Lines 40-44: These are development-level logging
console.log(`\n🚀 Starting trip optimization...`);
console.log(`📍 From: ${source} → To: ${destination}`);
console.log(`💰 Budget: ₹${totalBudget}`);
console.log(`👥 Travelers: ${numberOfTravelers}`);
if (numberOfDays) console.log(`📅 Days: ${numberOfDays}`);
```
**Action:** Move to debug logger or remove entirely.

**File:** [server/controllers/travelController.js](server/controllers/travelController.js#L255-L256)
```javascript
console.log(`✅ Trip optimization completed!`);
console.log(`🎯 Optimization Score: ${optimizationResult.optimizationScore}/100\n`);
```

**File:** [server/controllers/imageController.js](server/controllers/imageController.js#L30,L61,L84,L97)
- Line 30: `console.log(\`\n📸 Fetching images for: ${destination}\`)`
- Line 61: `console.log(\`\n📸 Fetching images for ${destinations.length} destinations\`)`
- Line 84: `console.log(\`\n🔍 Searching images for: ${searchQuery}\`)`
- Line 97: `console.log('\n🗑️  Clearing image cache...')`

**File:** [server/services/trainService.js](server/services/trainService.js#L38-L40)
```javascript
console.log(`✅ Cache hit for ${fromCode} → ${toCode}`);
console.log(`⚠️ No direct trains found. Attempting multi-hop routing...`);
```

**File:** [server/services/enhancedTravelPlan.service.js](server/services/enhancedTravelPlan.service.js#L51,L52)
```javascript
console.error('Error getting budget trains:', error.message);
console.error('Error getting fastest trains:', error.message);
```

#### Complete List of Debug Logs by File

| File | Count | Lines | Severity |
|------|-------|-------|----------|
| [travelController.js](server/controllers/travelController.js) | 8 | 40-44, 255-256, 321-325, 370-371 | HIGH |
| [travelPlan.controller.js](server/controllers/travelPlan.controller.js) | 2 | 71, 129 | MEDIUM |
| [imageController.js](server/controllers/imageController.js) | 4 | 30, 61, 84, 97 | MEDIUM |
| [facilitiesController.js](server/controllers/facilitiesController.js) | 0 | N/A | LOW |
| [trainService.js](server/services/trainService.js) | 14 | 32-40, 287, 416, 503, 540, 610 | HIGH |
| [enhancedTravelPlan.service.js](server/services/enhancedTravelPlan.service.js) | 6 | 63, 124, 226 | MEDIUM |
| [imageService.js](server/services/imageService.js) | 15+ | throughout file | MEDIUM |
| [multiDestinationOptimizer.js](server/services/multiDestinationOptimizer.js) | 25+ | throughout file | HIGH |
| [optimizationAlgorithm.js](server/utils/optimizationAlgorithm.js) | 8+ | 57, 125, 138, 152, 369 | HIGH |
| [paymentController.js](server/controllers/paymentController.js) | 4 | 115, 130, 198, 202, 235, 410 | MEDIUM |
| [authController.js](server/controllers/authController.js) | 1 | 47, 545 | LOW |
| [seedDatabase.js](server/utils/seedDatabase.js) | 9 | throughout file | LOW |
| [test files](server/test-*.js) | 15+ | throughout | LOW (test files) |

**Recommendation:** Create a centralized logger utility and replace all console statements:
```javascript
// Create server/utils/logger.js
const logger = {
  debug: (msg) => process.env.DEBUG === 'true' ? console.log(msg) : null,
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
};
```

---

## 2. DUPLICATE CODE & FUNCTIONS

### 2.1 Duplicate Function Definitions: formatTime & formatDuration

**Severity:** CRITICAL | **Impact:** Maintainability, Bug Risk  
**File:** [server/controllers/travelController.js](server/controllers/travelController.js)

#### Issue Details

Function `formatTime` is defined **twice** in the same file:

**Definition 1 (Lines 20-24):**
```javascript
// Helper function to format time (convert "12.40" to "12:40")
const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return String(timeStr).replace('.', ':');
};
```

**Definition 2 (Lines 83-87):**
```javascript
// Helper function to format time (convert "12.40" to "12:40")
const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return String(timeStr).replace('.', ':');
};
```

Function `formatDuration` is defined **twice**:

**Definition 1 (Lines 26-37):**
```javascript
const formatDuration = (durationStr) => {
  if (!durationStr) return null;
  const timeStr = String(durationStr).trim();
  const parts = timeStr.split('.');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const decimalMinutes = parseInt(parts[1], 10);
    const minutes = Math.round((decimalMinutes / 100) * 60);
    return `${hours}h ${minutes}m`;
  }
  return timeStr;
};
```

**Definition 2 (Lines 89-100):**
```javascript
const formatDuration = (durationStr) => {
  if (!durationStr) return null;
  const timeStr = String(durationStr).trim();
  const parts = timeStr.split('.');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const decimalMinutes = parseInt(parts[1], 10);
    const minutes = Math.round((decimalMinutes / 100) * 60);
    return `${hours}h ${minutes}m`;
  }
  return timeStr;
};
```

**Action:** Remove duplicates. Define once at file scope:
```javascript
// At top of file, after imports
const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return String(timeStr).replace('.', ':');
};

const formatDuration = (durationStr) => {
  if (!durationStr) return null;
  const timeStr = String(durationStr).trim();
  const parts = timeStr.split('.');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const decimalMinutes = parseInt(parts[1], 10);
    const minutes = Math.round((decimalMinutes / 100) * 60);
    return `${hours}h ${minutes}m`;
  }
  return timeStr;
};
```

### 2.2 Similar Transport Selection Logic (Repeated 3x)

**Severity:** MEDIUM | **Impact:** Maintainability  
**Files:** [travelController.js](server/controllers/travelController.js), [optimizationAlgorithm.js](server/utils/optimizationAlgorithm.js), [multiDestinationOptimizer.js](server/services/multiDestinationOptimizer.js)

All three files have nearly identical logic for:
1. Filtering transport options by budget
2. Selecting preferred transport based on tier
3. Falling back to alternatives if budget exceeded

**Recommendation:** Extract to a shared utility service:
```javascript
// server/services/transportSelectionService.js
const selectTransport = (options, budget, tier, numberOfTravelers) => {
  // ... shared logic
};
```

### 2.3 Duplicate Cache Management Code

**Severity:** MEDIUM | **Impact:** Code Duplication  
**Files:** [trainService.js](server/services/trainService.js), [imageService.js](server/services/imageService.js)

Both implement similar in-memory cache patterns:
```javascript
// Pattern 1: trainService
const trainCache = new Map();
function getFromCache(fromCode, toCode) { ... }
function setInCache(fromCode, toCode, data) { ... }

// Pattern 2: imageService  
const imageCache = new Map();
const getCachedImages = (destination) => { ... }
const setCachedImages = (destination, data) => { ... }
```

**Recommendation:** Create a generic caching utility:
```javascript
// server/utils/cache.js
class SimpleCache {
  constructor(ttl = 30 * 60 * 1000) {
    this.store = new Map();
    this.ttl = ttl;
  }
  get(key) { ... }
  set(key, value) { ... }
  clear(key) { ... }
}
module.exports = SimpleCache;
```

---

## 3. UNUSED IMPORTS & DEPENDENCIES

### 3.1 Potentially Unused Imports

**Severity:** LOW | **Impact:** Bundle Size, Code Clarity

**File:** [server/services/multiDestinationOptimizer.js](server/services/multiDestinationOptimizer.js)
- Line 8: `const { searchFlights, searchHotels, searchTrains } = require('./externalApiService');`
  - `searchHotels` is imported but used in the code (✓ used)
  - All three are used, but verify they're all needed

**File:** [server/utils/optimizationAlgorithm.js](server/utils/optimizationAlgorithm.js#L19-L22)
```javascript
const Transport = require('../models/Transport');
const Hotel = require('../models/Hotel');
const Restaurant = require('../models/Restaurant');
```
- These are conditionally used in database fallback logic, but verify they're actually called

**Recommendation:** Audit all imports and remove unused ones.

---

## 4. CRITICAL BUGS

### 4.1 Undefined Variable: `cheapest` in multiDestinationOptimizer.js

**Severity:** CRITICAL | **File:** [server/services/multiDestinationOptimizer.js](server/services/multiDestinationOptimizer.js#L165-L200)  
**Impact:** Runtime Error - undefined variable causes crash

#### Issue

In the travel leg selection logic, the code references `cheapest` but the variable is never defined:

```javascript
selectedTravel.push({
  from: leg.from,
  to: leg.to,
  mode: cheapest.mode,                           // ❌ undefined
  provider: cheapest.provider || cheapest.airline || 'Unknown',
  details: cheapest,
  costPerPerson: cheapest.totalCost || cheapest.price,
  totalCost: costForAllTravelers,
});
```

The variable should be `selectedOption` (which is properly selected above):

#### Fix

Replace all references to `cheapest` with `selectedOption`:
```javascript
selectedTravel.push({
  from: leg.from,
  to: leg.to,
  mode: selectedOption.mode,
  provider: selectedOption.provider || selectedOption.airline || 'Unknown',
  details: selectedOption,
  costPerPerson: selectedOption.totalCost || selectedOption.price,
  totalCost: costForAllTravelers,
});
```

---

## 5. INEFFICIENT IMPLEMENTATIONS

### 5.1 Overly Complex optimizationAlgorithm.js

**Severity:** MEDIUM | **File:** [server/utils/optimizationAlgorithm.js](server/utils/optimizationAlgorithm.js)  
**Lines:** 1-700+  
**Complexity:** O(n²) in places, could be optimized

#### Issues

1. **Function Size:** Main `optimizeTripBudget` function spans 500+ lines
2. **Nested Loops:** Multiple nested loops for transport filtering (lines 120-170)
3. **Repeated Sorting:** Transports sorted multiple times (lines 82, 105, 125)
4. **Resource Queries:** Database queries inside loops for accommodation finding (line 605+)

#### Optimization Opportunities

```javascript
// BEFORE: Inefficient with multiple loops and sorts
transportOptions.sort((a, b) => a.totalCost - b.totalCost); // Sort 1
for (const transport of transportOptions) {
  const transportCost = transport.totalCost * numberOfTravelers;
  if (transportCost <= totalBudget * threshold) {
    selectedTransport = transport;
    break;
  }
}
// ... later, sort again
transportOptions = [...transportOptions, ...getUltraBudgetTransportOptions(...)];
transportOptions.sort((a, b) => a.totalCost - b.totalCost); // Sort 2

// AFTER: Single sort with better logic
const sortedByPrice = transportOptions
  .filter(t => t.totalCost * numberOfTravelers <= totalBudget)
  .sort((a, b) => a.totalCost - b.totalCost);

const selectedTransport = sortedByPrice.length > 0 
  ? sortedByPrice[0] 
  : transportOptions[0];
```

### 5.2 Multiple API Calls in Loops

**Severity:** MEDIUM | **File:** [server/services/multiDestinationOptimizer.js](server/services/multiDestinationOptimizer.js#L120-L150)

```javascript
for (const nextCity of destinations) {
  const [flights, trains] = await Promise.all([
    searchFlights({...}),        // ❌ Sequential API calls per destination
    isDomestic ? searchTrains({...}) : Promise.resolve([]),
  ]);
  travelLegs.push({...});
}
```

**Optimization:** Use Promise.all() for all destinations at once:
```javascript
const travelLegs = await Promise.all(
  destinations.map(nextCity =>
    Promise.all([
      searchFlights({...}),
      isDomestic ? searchTrains({...}) : Promise.resolve([]),
    ]).then(([flights, trains]) => ({
      from: currentCity,
      to: nextCity,
      flights, trains
    }))
  )
);
```

### 5.3 Inefficient Image Service API Fallback Loop

**Severity:** LOW | **File:** [server/services/imageService.js](server/services/imageService.js#L350-L380)

The API priority loop tries each API sequentially:
```javascript
for (const api of apis) {
  const images = await api.fetch(destination);
  if (images && images.length > 0) {
    return result;
  }
}
```

For better performance with multiple documents in batch requests, use `Promise.allSettled()`:
```javascript
const results = await Promise.allSettled(
  apis.map(api => api.fetch(destination))
);
const firstSuccess = results.find(r => r.status === 'fulfilled' && r.value?.length);
```

---

## 6. REDUNDANT HELPER FUNCTIONS

### 6.1 Duplicate Calculation Functions

**Severity:** LOW | **Impact:** Code Clarity

Multiple files define similar distance/fare calculation functions:

**File:** [server/services/externalApiService.js](server/services/externalApiService.js)
- `calculateDistanceBasedPrice()` at ~line 300

**File:** [server/utils/optimizationAlgorithm.js](server/utils/optimizationAlgorithm.js)
- `calculateDistance()` referenced but may not be defined
- `getEstimatedTransportCosts()` at line 440

**Recommendation:** Consolidate into a shared utility:
```javascript
// server/utils/distanceCalculator.js
const MAJOR_ROUTES = {
  'delhi-mumbai': 1400,
  'delhi-bangalore': 2200,
  // ... more routes
};

const calculateDistance = (from, to) => {
  const key = `${from}-${to}`.toLowerCase();
  return MAJOR_ROUTES[key] || estimateByAirDistance(from, to);
};
```

---

## 7. MISSING EXPORTS & INCOMPLETE IMPLEMENTATIONS

### 7.1 Verify Exports

**File:** [server/middleware/validator.js](server/middleware/validator.js#L252-L263)

All required validations are exported ✓

**File:** [server/services/trainService.js](server/services/trainService.js#L690+)

Verify all used functions are exported:
- ✓ `getTrainsBetweenStations`
- ✓ `getTrainsOnDate`
- ✓ `getTrainInfo`
- ✓ `getTrainRoute`
- ✓ `sortTrainsByTime`
- ✓ `sortTrainsByDeparture`
- ✓ `STATION_CODES`

---

## 8. SIMILAR SERVICE METHODS THAT COULD BE CONSOLIDATED

### 8.1 Transport Tier Selection Logic (3 places)

- [travelController.js](server/controllers/travelController.js) - `optimizeTrip`
- [optimizationAlgorithm.js](server/utils/optimizationAlgorithm.js) - Transport Pass 1/2/3
- [multiDestinationOptimizer.js](server/services/multiDestinationOptimizer.js) - Budget tier selection

**Consolidation Target:** Create `server/services/transportSelectionService.js`

### 8.2 Budget Classification & Allocation

- [budgetClassifier.service.js](server/services/budgetClassifier.service.js)
- [budgetAllocator.service.js](server/services/budgetAllocator.service.js)

These could be consolidated into a single `budgetService.js`

### 8.3 Train Data Parsing

- [trainService.js](server/services/trainService.js) - API fetching
- [enhancedTravelPlan.service.js](server/services/enhancedTravelPlan.service.js) - Budget train selection
- [railPrettify.js](server/utils/railPrettify.js) - HTML parsing

Could consolidate data layer logic

---

## 9. PERFORMANCE ISSUES

### 9.1 Inefficient Regex Operations in railPrettify.js

**File:** [server/utils/railPrettify.js](server/utils/railPrettify.js#L263-L275)

```javascript
// Complex regex pattern with global state
const pattern = /data\s*=\s*({.*?;)/;
const match = htmlString.match(pattern);
```

This runs on every HTML parse. Consider:
- Memoizing pattern compilation
- Pre-compiling regex patterns at module load

### 9.2 Repeated String Operations

Multiple files do string replacements in loops:
```javascript
// In optimizationAlgorithm.js
for (const transport of transportOptions) {
  // ... string operations repeated
}
```

Consider moving string preprocessing outside loops.

### 9.3 Database Queries Without Pagination Limits

**File:** [server/utils/optimizationAlgorithm.js](server/utils/optimizationAlgorithm.js#L630)

```javascript
const restaurants = await Restaurant.find({
  city: destination,
  averageCost: { $gt: 0, $lt: maxPrice }
}).lean(); // ❌ No limit specified
```

**Fix:** Add `.limit(10)` to prevent large result sets

---

## 10. SUMMARY TABLE: OPTIMIZATION PRIORITIES

| Issue | Severity | Type | Files Affected | Effort | Impact |
|-------|----------|------|---|--------|--------|
| Debug console logs | HIGH | Code Quality | 12+ | Low | High |
| formatTime/formatDuration duplicates | CRITICAL | Duplication | travelController | Low | High |
| Undefined `cheapest` variable | CRITICAL | Bug | multiDestinationOptimizer | Low | Critical |
| Transport selection logic (3x) | MEDIUM | Duplication | 3 files | Medium | Medium |
| Image cache + train cache duplication | MEDIUM | Duplication | 2 files | Low | Low |
| optimizationAlgorithm.js complexity | MEDIUM | Complexity | 1 file | High | Medium |
| Multiple API calls in loops | MEDIUM | Performance | multiDestinationOptimizer | Medium | Medium |
| Missing `.limit()` on queries | MEDIUM | Performance | optimizationAlgorithm | Low | Low |
| Unused imports audit | LOW | Code Quality | 3+ files | Low | Low |

---

## 11. RECOMMENDED REFACTORING ORDER

### Phase 1: Critical Fixes (1-2 hours)
1. ✅ Fix undefined `cheapest` variable in multiDestinationOptimizer.js
2. ✅ Remove duplicate `formatTime` and `formatDuration` functions
3. ✅ Add `.limit()` to database queries

### Phase 2: Code Quality (2-3 hours)
4. Create centralized logger utility and replace console statements
5. Create shared `transportSelectionService.js`
6. Create shared caching utility

### Phase 3: Performance (2-4 hours)
7. Optimize API calls in multiDestinationOptimizer (batch with Promise.all)
8. Break down optimizationAlgorithm.js into smaller functions
9. Consolidate budget services

### Phase 4: Cleanup (1-2 hours)
10. Remove unused imports
11. Check for orphaned test files
12. Update JSDoc comments

---

## 12. CODE IMPROVEMENT EXAMPLES

### Before: Duplicate code
```javascript
// server/controllers/travelController.js - lines 20-24
const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return String(timeStr).replace('.', ':');
};

// ... later, same function again at lines 83-87
const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return String(timeStr).replace('.', ':');
};
```

### After: Shared utility
```javascript
// server/utils/dateFormatter.js
const formatTime = (timeStr) => {
  if (!timeStr) return null;
  return String(timeStr).replace('.', ':');
};

const formatDuration = (durationStr) => {
  if (!durationStr) return null;
  const timeStr = String(durationStr).trim();
  const parts = timeStr.split('.');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const decimalMinutes = parseInt(parts[1], 10);
    const minutes = Math.round((decimalMinutes / 100) * 60);
    return `${hours}h ${minutes}m`;
  }
  return timeStr;
};

module.exports = { formatTime, formatDuration };
```

---

## 13. ADDITIONAL NOTES

- The codebase uses good separation of concerns (controllers, services, models)
- Authentication and error handling are well-structured
- Consider adding TypeScript for better type safety and IDE support
- Consider adding ESLint with unused-variable rules to catch these issues automatically
- Add pre-commit hooks to enforce code quality standards

---

**End of Report**
