# 🚂 Train Facilities API Guide

## Overview

The Train Facilities API provides comprehensive information about amenities and facilities available on Indian trains. Check what's available before booking your journey!

---

## 🎯 Features

✅ Check facilities by train class (1A, 2A, 3A, SL, UR)
✅ Explore typical amenities by train type (Rajdhani, Shatabdi, Express)
✅ Filter by comfort level (Premium, High, Medium, Budget, Basic)
✅ Compare facilities across multiple trains
✅ Get best value recommendations
✅ Check specific amenities

---

## 📚 Base Endpoints

All facilities endpoints start with `/api/facilities`

---

## 🔍 Endpoint Reference

### 1. Get Facilities by Train Class

**Endpoint:** `GET /api/facilities/by-class`

**Parameters:**
- `class` (required): Train class code

**Supported Classes:**
- `1A` - First AC (Premium)
- `2A` - Second AC (High Comfort)
- `3A` - Third AC (Medium)
- `SL` - Sleeper (Budget)
- `UR` - General/Unreserved (Basic)

**Example:**
```bash
curl "http://localhost:5000/api/facilities/by-class?class=2A"
```

**Response:**
```json
{
  "success": true,
  "message": "Facilities for Second AC (2A)",
  "data": {
    "code": "2A",
    "name": "Second AC",
    "comfort_level": "High",
    "facilities": [
      "AC",
      "Shared Berth",
      "Bedding",
      "Meals",
      "WiFi",
      "Charging",
      "Toilet",
      "Pantry"
    ],
    "typical_capacity": 48,
    "price_factor": 0.5
  }
}
```

---

### 2. Get Facilities by Train Type

**Endpoint:** `GET /api/facilities/by-type`

**Parameters:**
- `type` (required): Train type name

**Supported Types:**
- `RAJDHANI` - Premium express trains
- `SHATABDI` - Day express trains
- `EXPRESS` - Regular express trains
- `LOCAL` - Commuter/passenger trains

**Example:**
```bash
curl "http://localhost:5000/api/facilities/by-type?type=RAJDHANI"
```

**Response:**
```json
{
  "success": true,
  "message": "Facilities for RAJDHANI trains",
  "data": {
    "type": "Express",
    "speed": "High Speed",
    "typical_classes": ["1A", "2A", "FC (First Class)"],
    "amenities": {
      "dining": "Full Dining Service",
      "food": "Complimentary Meals",
      "wifi": "Yes",
      "charging": "Multiple Points",
      "bedding": "Complimentary",
      "pantry": "Premium"
    }
  }
}
```

---

### 3. Get Facilities by Comfort Level

**Endpoint:** `GET /api/facilities/by-comfort`

**Parameters:**
- `level` (optional): Comfort level
  - `premium` - First Class AC
  - `high` - Second AC
  - `medium` - Third AC
  - `budget` - Sleeper
  - `basic` - General/Unreserved

**Example (Get all levels):**
```bash
curl "http://localhost:5000/api/facilities/by-comfort"
```

**Example (Get specific level):**
```bash
curl "http://localhost:5000/api/facilities/by-comfort?level=premium"
```

**Response:**
```json
{
  "success": true,
  "message": "Facilities for premium comfort level",
  "data": [
    {
      "comfort": "Premium",
      "name": "First AC",
      "code": "1A",
      "facilities": [
        "AC",
        "Personal Berth",
        "Bedding",
        "Meals",
        "WiFi",
        "Charging",
        "Toilet",
        "Pantry"
      ],
      "capacity": 18,
      "price_factor": 1.0
    }
  ]
}
```

---

### 4. Check Specific Facility

**Endpoint:** `GET /api/facilities/check`

**Parameters:**
- `trainType` (required): Train type
- `facility` (required): Facility to check

**Common Facilities:**
- wifi - WiFi connectivity
- charging - Charging points
- meals - Meals service
- bedding - Bedding provided
- pantry - Pantry service
- ac - Air conditioning
- dining - Dining car

**Example:**
```bash
curl "http://localhost:5000/api/facilities/check?trainType=RAJDHANI&facility=wifi"
```

**Response:**
```json
{
  "success": true,
  "train_type": "RAJDHANI",
  "facility": "wifi",
  "has_facility": true,
  "message": "RAJDHANI trains have wifi"
}
```

---

### 5. Get Best Value Facilities

**Endpoint:** `GET /api/facilities/best-value`

**Example:**
```bash
curl "http://localhost:5000/api/facilities/best-value"
```

**Response:**
```json
{
  "success": true,
  "message": "Best value facilities (comfort vs price)",
  "data": {
    "name": "Third AC",
    "code": "3A",
    "comfort": "Medium",
    "facilities": [
      "AC",
      "Shared Berth",
      "Basic Bedding",
      "WiFi",
      "Charging (Limited)",
      "Toilet",
      "Pantry"
    ],
    "price_factor": 0.27,
    "capacity": 72,
    "recommendation": "Third AC offers the best balance of comfort and affordability"
  }
}
```

---

### 6. Compare Facilities Between Trains

**Endpoint:** `GET /api/facilities/compare`

**Parameters:**
- `from` (required): Source city
- `to` (required): Destination city
- `date` (optional): Travel date (DD-MM-YYYY)

**Example:**
```bash
curl "http://localhost:5000/api/facilities/compare?from=Delhi&to=Mumbai&date=25-03-2026"
```

**Response:**
```json
{
  "success": true,
  "message": "Comparing facilities for trains from Delhi to Mumbai",
  "from_city": "Delhi",
  "to_city": "Mumbai",
  "date": "25-03-2026",
  "trains": [
    {
      "train_no": "12002",
      "train_name": "SHATABDI EXPRESS",
      "departure": "16:00",
      "arrival": "06:15+1",
      "duration": "14h 15m",
      "type_info": {
        "type": "Express",
        "speed": "High Speed Day Train",
        "amenities": {
          "dining": "Dining Car",
          "food": "Complimentary Meals",
          "wifi": "Yes",
          "charging": "Available"
        }
      },
      "amenities": {
        "dining": "Dining Car",
        "food": "Complimentary Meals",
        "wifi": "Yes",
        "charging": "Available"
      }
    }
  ]
}
```

---

### 7. Get All Amenities List

**Endpoint:** `GET /api/facilities/amenities`

**Example:**
```bash
curl "http://localhost:5000/api/facilities/amenities"
```

**Response:**
```json
{
  "success": true,
  "message": "Available amenities on Indian trains",
  "data": {
    "wifi": "Free WiFi connectivity",
    "charging": "USB/Power charging points",
    "meals": "Complimentary meals",
    "bedding": "Free bedding set",
    "pantry": "Onboard pantry service",
    "ac": "Air-conditioned compartment",
    "toilet": "Modern toilet facilities",
    "dining": "Dining car service",
    "wheelchair": "Wheelchair accessibility",
    "luggage": "Extra luggage allowance",
    "entertainment": "Entertainment system",
    "reading_light": "Individual reading lights",
    "locker": "Personal locker/safe",
    "attendant": "24/7 attendant service"
  },
  "total": 14
}
```

---

### 8. Get All Facilities Reference

**Endpoint:** `GET /api/facilities/all`

**Example:**
```bash
curl "http://localhost:5000/api/facilities/all"
```

Returns complete reference data for all train classes and types.

---

## 🚂 Train Classes Explained

### 1A - First AC (Premium)
- **Comfort:** Premium
- **Capacity:** 18 passengers
- **Facilities:** AC, Personal Berth, Bedding, Meals, WiFi, Charging, Toilet, Pantry
- **Best For:** Maximum comfort travelers
- **Price Factor:** 1.0 (highest)

### 2A - Second AC (High Comfort)
- **Comfort:** High
- **Capacity:** 48 passengers
- **Facilities:** AC, Shared Berth, Bedding, Meals, WiFi, Charging, Toilet, Pantry
- **Best For:** Comfort-conscious travelers
- **Price Factor:** 0.5

### 3A - Third AC (Medium)
- **Comfort:** Medium
- **Capacity:** 72 passengers
- **Facilities:** AC, Shared Berth, Basic Bedding, WiFi, Limited Charging, Toilet, Pantry
- **Best For:** Budget-conscious with comfort needs
- **Price Factor:** 0.27 (best value)

### SL - Sleeper (Budget)
- **Comfort:** Budget
- **Capacity:** 96 passengers
- **Facilities:** Open Berth, Toilet, Pantry, Basic WiFi
- **Best For:** Long-distance budget travelers
- **Price Factor:** 0.13

### UR - General/Unreserved (Basic)
- **Comfort:** Basic
- **Capacity:** 200+ passengers
- **Facilities:** Unreserved Seat, Toilet, Basic Amenities
- **Best For:** Short-distance, cheapest option
- **Price Factor:** 0.05 (cheapest)

---

## 🚆 Train Types Explained

### RAJDHANI (Premium Express)
- Speed: High Speed
- Duration: Typically 14-18 hours for long routes
- Classes: 1A, 2A
- Special: Full dining, complimentary meals, WiFi, premium service
- Best For: Premium travelers, business trips

### SHATABDI (Day Express)
- Speed: High Speed Day Train
- Duration: 6-14 hours
- Classes: AC 1, AC 2, Chair Car
- Special: Complimentary meals, dining car
- Best For: Day travel, good connectivity, no overnight travel

### EXPRESS (Regular)
- Speed: Normal Speed
- Duration: Variable
- Classes: 1A, 2A, 3A, SL, UR
- Special: Pantry, basic amenities
- Best For: Budget travelers, variety of options

### LOCAL (Commuter)
- Speed: Regular with many stops
- Duration: Short to medium
- Classes: UR, SL (limited)
- Special: Basic amenities
- Best For: Local/regional travel, short distances

---

## 💡 Common Use Cases

### Use Case 1: Check if WiFi Available
```bash
curl "http://localhost:5000/api/facilities/check?trainType=RAJDHANI&facility=wifi"
```

### Use Case 2: Find Best Budget Option
```bash
curl "http://localhost:5000/api/facilities/best-value"
# Result: Third AC (3A) offers best comfort-to-price ratio
```

### Use Case 3: Compare All Trains on Route
```bash
curl "http://localhost:5000/api/facilities/compare?from=Delhi&to=Mumbai"
# Compares top 5 trains with facilities
```

### Use Case 4: Check All Premium Options
```bash
curl "http://localhost:5000/api/facilities/by-comfort?level=premium"
# Shows all premium class facilities
```

### Use Case 5: Get Shatabdi Amenities
```bash
curl "http://localhost:5000/api/facilities/by-type?type=SHATABDI"
# Shows typical Shatabdi amenities
```

---

## 📊 Facility Comparison Table

| Feature | 1A | 2A | 3A | SL | UR |
|---------|----|----|----|----|-----|
| **AC** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **WiFi** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Bedding** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Meals** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Charging** | ✅ | ✅ | Limited | ❌ | ❌ |
| **Toilet** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Capacity** | 18 | 48 | 72 | 96 | 200+ |
| **Price Factor** | 1.0 | 0.5 | 0.27 | 0.13 | 0.05 |

---

## 🎯 Quick Reference

### Quick Check Commands

```bash
# Get all comfort levels
curl http://localhost:5000/api/facilities/by-comfort

# Get all amenities
curl http://localhost:5000/api/facilities/amenities

# Get all references
curl http://localhost:5000/api/facilities/all

# Get best value
curl http://localhost:5000/api/facilities/best-value

# Check specific facility
curl "http://localhost:5000/api/facilities/check?trainType=EXPRESS&facility=charging"

# Compare trains on route
curl "http://localhost:5000/api/facilities/compare?from=Delhi&to=Bangalore"
```

---

## 🔗 Integration with Travel System

### In Travel Optimization
The facilities checker can be integrated to:
1. Show facilities in search results
2. Recommend based on traveler preferences
3. Compare options for decision making
4. Highlight special amenities

### Combined Search Example
```bash
# Search trains + show facilities
GET /api/trains/between?from=Delhi&to=Mumbai
GET /api/facilities/compare?from=Delhi&to=Mumbai

# Results show both schedules and facilities
```

---

## 📝 Notes

- Facilities listed are typical/average for each class
- Actual facilities may vary by specific train
- For official details, always check IRCTC website
- Prices are estimates
- Availability subject to train type and route

---

## 🆘 Troubleshooting

### "No facilities found for class"
- Check valid class codes: 1A, 2A, 3A, SL, UR

### "Train type not recognized"
- Use standard names: RAJDHANI, SHATABDI, EXPRESS, LOCAL
- Or partial names like "RAJDHANI EXPRESS"

### No WiFi on some trains
- WiFi availability varies by train and region
- Express trains may have limited WiFi

---

**Last Updated:** March 20, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
