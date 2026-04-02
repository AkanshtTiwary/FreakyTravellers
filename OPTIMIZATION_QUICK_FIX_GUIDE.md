# Quick Fix Guide - TravelBudget Optimization

**Priority Order: Fix these issues first**

---

## 🔴 CRITICAL (Fix Immediately)

### 1. Undefined Variable Bug - `cheapest` variable
**File:** `server/services/multiDestinationOptimizer.js` (Lines 165-200)  
**Impact:** Runtime crash  
**Fix Time:** 2 minutes

**Problem:**
```javascript
selectedTravel.push({
  mode: cheapest.mode,  // ❌ undefined variable
  provider: cheapest.provider,
});
```

**Solution:**
Replace all `cheapest` with `selectedOption`:
```javascript
selectedTravel.push({
  mode: selectedOption.mode,
  provider: selectedOption.provider || selectedOption.airline || 'Unknown',
  details: selectedOption,
});
```

---

### 2. Duplicate Function Definitions
**File:** `server/controllers/travelController.js`  
**Impact:** Confusing code, maintainability  
**Fix Time:** 5 minutes

**Problems:**
- `formatTime` defined at lines 20-24 AND 83-87
- `formatDuration` defined at lines 26-37 AND 89-100

**Solution:**
Copy one definition to the top of the file, delete the duplicates.

Or extract to shared utility:

```javascript
// Create: server/utils/dateFormatter.js
module.exports = {
  formatTime: (timeStr) => {
    if (!timeStr) return null;
    return String(timeStr).replace('.', ':');
  },
  
  formatDuration: (durationStr) => {
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
  }
};

// In travelController.js:
const { formatTime, formatDuration } = require('../utils/dateFormatter');
```

---

## 🟠 HIGH PRIORITY (Week 1)

### 3. Excessive Debug Logging (87 instances)
**Impact:** Performance, production readiness  
**Time:** 1-2 hours

**Files to clean:**
- `server/controllers/travelController.js` (8 logs) - lines 40-44, 255-256, 321-325, 370-371
- `server/services/trainService.js` (14 logs)
- `server/services/multiDestinationOptimizer.js` (25+ logs)
- `server/utils/optimizationAlgorithm.js` (8+ logs)
- `server/services/imageService.js` (15+ logs)

**Solution:**

Option 1: Remove development-only logs
```javascript
// Change from:
console.log(`\n🚀 Starting trip optimization...`);

// To: Remove entirely for production, or use logging service
```

Option 2: Create logger utility (recommended)
```javascript
// server/utils/logger.js
const logger = {
  debug: (msg) => {
    if (process.env.DEBUG === 'true') console.log(`[DEBUG] ${msg}`);
  },
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
};

module.exports = logger;

// Usage:
const logger = require('../utils/logger');
logger.debug(`Starting trip optimization...`);
logger.info(`Trip optimization completed!`);
```

---

### 4. Database Query Missing `.limit()`
**File:** `server/utils/optimizationAlgorithm.js` (Line 630+)  
**Impact:** Performance - unbounded queries  
**Fix Time:** 5 minutes

**Problems:**
```javascript
const restaurants = await Restaurant.find({
  city: destination,
  averageCost: { $gt: 0, $lt: maxPrice }
}).lean(); // ❌ No limit
```

**Solution:**
```javascript
const restaurants = await Restaurant.find({
  city: destination,
  averageCost: { $gt: 0, $lt: maxPrice }
})
.lean()
.limit(10); // Add limit
```

---

## 🟡 MEDIUM PRIORITY (Week 2-3)

### 5. Duplicate Transport Selection Logic (3 places)
**Impact:** Maintainability, bug consistency  
**Time:** 2-3 hours

Appears in:
- `server/controllers/travelController.js` - optimizeTrip()
- `server/utils/optimizationAlgorithm.js` - optimizeTripBudget()
- `server/services/multiDestinationOptimizer.js` - optimizeMultiDestinationTrip()

**Solution:** Create shared service:
```javascript
// server/services/transportSelectionService.js
const selectAffordableTransport = (options, budget, tier, numberOfTravelers) => {
  const thresholds = {
    premium: 0.50,
    comfort: 0.60,
    budget: 0.70
  };
  
  const threshold = thresholds[tier] || 0.60;
  const sortedByPrice = options
    .filter(t => t.totalCost * numberOfTravelers <= budget * threshold)
    .sort((a, b) => a.totalCost - b.totalCost);
  
  return sortedByPrice[0] || options.sort((a, b) => a.totalCost - b.totalCost)[0];
};

module.exports = { selectAffordableTransport };
```

Then use everywhere:
```javascript
const { selectAffordableTransport } = require('../services/transportSelectionService');
const selectedTransport = selectAffordableTransport(transportOptions, totalBudget, tier, numberOfTravelers);
```

---

### 6. Optimize Nested API Calls
**File:** `server/services/multiDestinationOptimizer.js` (Lines 120-150)  
**Impact:** Performance - sequential vs parallel  
**Time:** 1-2 hours

**Problem:**
```javascript
for (const nextCity of destinations) {
  const [flights, trains] = await Promise.all([
    searchFlights({...}),
    searchTrains({...})
  ]);
  // Sequential: waits for each destination pair before next
}
```

**Solution:**
```javascript
const allLegs = await Promise.all(
  destinations.map((nextCity, idx) => {
    const from = idx === 0 ? startCity : destinations[idx - 1];
    return Promise.all([
      searchFlights({ origin: from, destination: nextCity, ... }),
      searchTrains({ source: from, destination: nextCity, ... })
    ]).then(([flights, trains]) => ({
      from, to: nextCity, flights, trains
    }));
  })
);
```

---

### 7. Extract Cache Utility (2 instances)
**Files:** `server/services/trainService.js`, `server/services/imageService.js`  
**Impact:** Code reuse  
**Time:** 30 minutes

**Solution:**
```javascript
// server/utils/cache.js
class TTLCache {
  constructor(ttl = 30 * 60 * 1000) {
    this.store = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this.store.set(key, { value, timestamp: Date.now() });
  }

  clear(key) {
    this.store.delete(key);
  }

  clearAll() {
    this.store.clear();
  }
}

module.exports = TTLCache;
```

Usage:
```javascript
const TTLCache = require('../utils/cache');

// In trainService.js
const trainCache = new TTLCache(30 * 60 * 1000);

function getFromCache(key) {
  return trainCache.get(key);
}

function setInCache(key, data) {
  trainCache.set(key, data);
}

// In imageService.js
const imageCache = new TTLCache(24 * 60 * 60 * 1000);
```

---

## 🟢 LOW PRIORITY (Polish)

### 8. Remove Unused Imports
**Files:** Multiple  
**Time:** 30 minutes

Use ESLint to find unused imports:
```bash
npm install --save-dev eslint
npx eslint . --ext .js --rules "no-unused-vars: error"
```

---

### 9. Break Down Overly Complex Functions
**File:** `server/utils/optimizationAlgorithm.js` (700+ lines)  
**Time:** 2-3 hours

Split `optimizeTripBudget` into:
- `findTransport()`
- `allocateRemainingBudget()`
- `findAccommodation()`
- `getRestaurants()`
- `buildTripResponse()`

---

### 10. Add ESLint Rules
**Time:** 1 hour

Add to `.eslintrc.json`:
```json
{
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-duplicate-case": "error",
    "no-redeclare": "error"
  }
}
```

---

## Implementation Checklist

- [ ] Fix `cheapest` variable (5 min)
- [ ] Remove duplicate `formatTime`/`formatDuration` (5 min)
- [ ] Add `.limit()` to restaurant query (5 min)
- [ ] Create logger utility (30 min)
- [ ] Replace console logs with logger (1 hour)
- [ ] Extract shared transport selection service (2 hours)
- [ ] Extract cache utility (30 min)
- [ ] Optimize multi-destination API calls (1-2 hours)
- [ ] Set up ESLint (1 hour)
- [ ] Refactor optimizationAlgorithm.js (2-3 hours)

**Total Effort:** 8-14 hours

---

## Testing

After each fix, test:
```bash
# Run tests
npm test

# Check for remaining console logs
grep -r "console\." server --include="*.js" | grep -v "^server/test"

# Run linter
npx eslint server --ext .js
```

---

**Generated:** April 2, 2026
