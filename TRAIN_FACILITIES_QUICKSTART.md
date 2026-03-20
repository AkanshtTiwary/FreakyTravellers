# 🚀 Train Facilities API - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Verify Files Are in Place
```bash
cd /Users/akanshtiwary/Desktop/TravelBudget

# Check backend files exist
ls -la server/utils/trainFacilities.js
ls -la server/controllers/facilitiesController.js
ls -la server/routes/facilitiesRoutes.js
```

### Step 2: Start the Server
```bash
cd server
npm install  # (if not already done)
node server.js
```

You should see:
```
✅ Server running on port 5000
✅ Database connected
✅ All routes mounted including /api/facilities
```

### Step 3: Test Endpoints

Open a new terminal and run:

```bash
# Test 1: Check 2A facilities
curl "http://localhost:5000/api/facilities/by-class?class=2A"

# Test 2: Check Rajdhani amenities
curl "http://localhost:5000/api/facilities/by-type?type=RAJDHANI"

# Test 3: Get best value
curl "http://localhost:5000/api/facilities/best-value"

# Test 4: Check WiFi availability
curl "http://localhost:5000/api/facilities/check?trainType=RAJDHANI&facility=wifi"

# Test 5: Get all amenities
curl "http://localhost:5000/api/facilities/amenities"
```

✅ **All tests passing!** Your facilities API is working.

---

## 📋 Available Endpoints

### Quick Reference

| What You Want | Endpoint | Example |
|--------------|----------|---------|
| Check 2A facilities | `/api/facilities/by-class?class=2A` | See amenities |
| Check Rajdhani | `/api/facilities/by-type?type=RAJDHANI` | See train type options |
| Get best value | `/api/facilities/best-value` | Find 3A recommended |
| Check WiFi | `/api/facilities/check?trainType=RAJDHANI&facility=wifi` | Boolean result |
| Compare trains | `/api/facilities/compare?from=Delhi&to=Mumbai` | Side-by-side comparison |
| Get all | `/api/facilities/all` | Complete reference |

---

## 🧪 Testing Scenarios

### Scenario 1: Budget Traveler
```bash
# Get best value option
curl "http://localhost:5000/api/facilities/best-value" | json_pp

# Result: 3A is best value with good facilities
```

### Scenario 2: Business Traveler
```bash
# Check if WiFi available on express trains
curl "http://localhost:5000/api/facilities/check?trainType=EXPRESS&facility=wifi" | json_pp

# Check charging availability
curl "http://localhost:5000/api/facilities/check?trainType=RAJDHANI&facility=charging" | json_pp
```

### Scenario 3: Compare Options
```bash
# Get all comfort options
curl "http://localhost:5000/api/facilities/by-comfort" | json_pp

# Compare premium vs budget
curl "http://localhost:5000/api/facilities/by-comfort?level=premium" | json_pp
curl "http://localhost:5000/api/facilities/by-comfort?level=budget" | json_pp
```

### Scenario 4: Route Planning
```bash
# Compare trains on route
curl "http://localhost:5000/api/facilities/compare?from=Delhi&to=Mumbai" | json_pp
```

---

## 💻 Using from Code

### Node.js/Express

```javascript
// In your controller or service
const axios = require('axios');

async function checkFacilities(classCode) {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/facilities/by-class?class=${classCode}`
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage
const facilities = await checkFacilities('2A');
console.log(facilities);
```

### React Frontend

```jsx
import React, { useState, useEffect } from 'react';

function FacilitiesDisplay() {
  const [facilities, setFacilities] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/facilities/best-value')
      .then(res => res.json())
      .then(data => setFacilities(data.data));
  }, []);

  return (
    <div>
      {facilities && (
        <>
          <h2>{facilities.name}</h2>
          <ul>
            {facilities.facilities.map(f => (
              <li key={f}>✓ {f}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

### HTML/Fetch

```html
<button onclick="checkWiFi()">Check WiFi</button>

<script>
async function checkWiFi() {
  const response = await fetch(
    'http://localhost:5000/api/facilities/check?trainType=RAJDHANI&facility=wifi'
  );
  const data = await response.json();
  alert(data.message);
}
</script>
```

---

## 🔍 Understanding Responses

### Success Response
```json
{
  "success": true,
  "message": "Facilities for Second AC (2A)",
  "data": {
    "code": "2A",
    "name": "Second AC",
    "facilities": ["AC", "WiFi", "Meals", ...],
    "typical_capacity": 48,
    "price_factor": 0.5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid class code. Valid: 1A, 2A, 3A, SL, UR",
  "error": "Invalid Request"
}
```

---

## 📊 Train Classes Reference

Quick lookup table:

| Class | Name | Price | WiFi | AC | Meals | Best For |
|-------|------|-------|------|-----|-------|----------|
| 1A | First AC | ₱₱₱₱ | ✓ | ✓ | ✓ | Premium |
| 2A | Second AC | ₱₱ | ✓ | ✓ | ✓ | Comfort |
| 3A | Third AC | ₱ | ✓ | ✓ | ✗ | **Best Value** |
| SL | Sleeper | ₱ | Limited | ✗ | ✗ | Budget |
| UR | General | Very Low | ✗ | ✗ | ✗ | Cheapest |

---

## 📱 Using with REST Client Extensions

### VS Code REST Client
Create a file `test-facilities.http`:

```http
### Get 2A Facilities
GET http://localhost:5000/api/facilities/by-class?class=2A

### Get Rajdhani Amenities
GET http://localhost:5000/api/facilities/by-type?type=RAJDHANI

### Check WiFi on RAJDHANI
GET http://localhost:5000/api/facilities/check?trainType=RAJDHANI&facility=wifi

### Get Best Value
GET http://localhost:5000/api/facilities/best-value

### Compare Trains
GET http://localhost:5000/api/facilities/compare?from=Delhi&to=Mumbai

### Get All Amenities
GET http://localhost:5000/api/facilities/amenities

### Get All Reference Data
GET http://localhost:5000/api/facilities/all
```

Then click "Send Request" above each endpoint.

### cURL Commands

```bash
# Copy and paste any of these:

curl "http://localhost:5000/api/facilities/by-class?class=2A" | json_pp

curl "http://localhost:5000/api/facilities/by-type?type=RAJDHANI" | json_pp

curl "http://localhost:5000/api/facilities/best-value" | json_pp

curl "http://localhost:5000/api/facilities/check?trainType=RAJDHANI&facility=wifi" | json_pp

curl "http://localhost:5000/api/facilities/compare?from=Delhi&to=Mumbai" | json_pp

curl "http://localhost:5000/api/facilities/amenities" | json_pp
```

---

## 🐛 Troubleshooting

### Issue: Cannot connect to localhost:5000
**Solution:**
1. Check server is running: `npm start` in server folder
2. Check port 5000 is available: `lsof -i :5000`
3. Check no firewall blocking

### Issue: "Invalid class code"
**Solution:** Use one of: `1A`, `2A`, `3A`, `SL`, `UR`

### Issue: Empty response
**Solution:**
1. Check route is mounted: Server logs should show `/api/facilities`
2. Check endpoint spelling (be exact with parameters)
3. Check server is running

### Issue: CORS error from frontend
**Solution:** Add CORS middleware to server.js:
```javascript
const cors = require('cors');
app.use(cors());
```

---

## 📚 API Parameter Reference

### Train Classes (for by-class endpoint)
- `1A` - First AC
- `2A` - Second AC ← Most popular
- `3A` - Third AC ← Best value
- `SL` - Sleeper
- `UR` - Unreserved/General

### Train Types (for by-type endpoint)
- `RAJDHANI` - Premium express
- `SHATABDI` - Day express
- `EXPRESS` - Regular trains
- `LOCAL` - Commuter trains

### Comfort Levels (for by-comfort endpoint)
- `premium` - First Class
- `high` - Second AC
- `medium` - Third AC
- `budget` - Sleeper
- `basic` - General

### Facilities (for check endpoint)
- `wifi` - WiFi connectivity
- `charging` - Power/USB charging
- `meals` - Complimentary meals
- `bedding` - Free bedding
- `pantry` - Pantry service
- `ac` - Air conditioning
- `toilet` - Toilet facilities
- `dining` - Dining car

---

## ✅ Validation Checklist

Before using in production:
- [ ] Server is running on port 5000
- [ ] All 8 endpoints respond with 200 status
- [ ] Response format is consistent JSON
- [ ] Error handling works for invalid inputs
- [ ] CORS enabled if using from different origin
- [ ] Database connection successful
- [ ] All routes visible in server logs

---

## 🎯 Common Workflows

### Workflow 1: Get Class Info
```bash
# Get what I want to know: What's in 2A class?
curl "http://localhost:5000/api/facilities/by-class?class=2A"
```

### Workflow 2: Budget Planning
```bash
# What's cheapest with good facilities?
curl "http://localhost:5000/api/facilities/best-value"
# Answer: 3A - 73% cheaper than 1A, still nice
```

### Workflow 3: Feature Check
```bash
# Do I get WiFi on Rajdhani?
curl "http://localhost:5000/api/facilities/check?trainType=RAJDHANI&facility=wifi"
# Answer: true/yes
```

### Workflow 4: Comparison Shopping
```bash
# Compare trains Delhi to Mumbai
curl "http://localhost:5000/api/facilities/compare?from=Delhi&to=Mumbai"
# Shows top 5 trains with side-by-side facilities
```

---

## 📞 Quick Help

| Question | Answer |
|----------|--------|
| Where is API? | `http://localhost:5000/api/facilities/` |
| How many endpoints? | 8 endpoints available |
| What data format? | JSON responses |
| Is it authenticated? | No authentication required |
| Can I cache? | Yes, data is static - cache for hours |
| What's best value class? | 3A (Third AC) |
| Does Rajdhani have WiFi? | Yes, check endpoint confirms |
| Can I compare trains? | Yes, use compare endpoint |

---

## 🚀 Next: Production Checklist

- [ ] Add authentication if needed
- [ ] Add rate limiting
- [ ] Add caching for performance
- [ ] Add CORS headers
- [ ] Test all error scenarios
- [ ] Monitor response times
- [ ] Log API usage
- [ ] Document for your team

---

## 📖 More Information

For complete documentation, see:
- **User Guide:** `TRAIN_FACILITIES_GUIDE.md`
- **Implementation Details:** `TRAIN_FACILITIES_IMPLEMENTATION.md`
- **Code Examples:** `FACILITIES_EXAMPLES.js`

---

**You're all set!** 🎉

Start with the quick scenarios above and gradually explore the full API capabilities.

**Get started now:**
```bash
# Copy and run in terminal:
curl "http://localhost:5000/api/facilities/best-value" | json_pp
```
